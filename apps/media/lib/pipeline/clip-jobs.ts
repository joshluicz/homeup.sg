import type { SupabaseClient } from "@supabase/supabase-js";
import { archiveRemoteFileToR2, getPublicR2Url } from "@/lib/r2";
import type { PipelineRunLogger } from "@/lib/pipeline/execution-log";
import {
  checkRoomClipStatus,
  fetchRoomClipResult,
  resolveFalModelForTask,
  startRoomClip,
} from "@/lib/pipeline/room-clip";
import {
  buildApproveResult,
  splitRoomsForProcessing,
  validateApproveInput,
} from "@/lib/pipeline/validate-approve-input";
import type {
  AdvanceClipsResult,
  ApproveBlueprintResult,
  RoomClipTask,
} from "@/lib/pipeline/types";

type MediaFileMetadata = {
  label?: string;
  fal_job_id?: string;
  fal_model?: string;
  image_urls?: string[];
  diagnostics?: unknown;
  source?: string;
  archived_to_r2?: boolean;
};

type ProcessingMediaFile = {
  id: string;
  job_id: string;
  file_name: string;
  r2_key: string;
  r2_url: string;
  duration_seconds: number | null;
  metadata: MediaFileMetadata | null;
  status: string;
};

export async function runApproveBlueprint(
  supabase: SupabaseClient,
  serviceSupabase: SupabaseClient,
  body: unknown,
  execution?: PipelineRunLogger,
): Promise<ApproveBlueprintResult> {
  const logger = execution ?? null;
  const { blueprint_id, room_photos } = await logger?.step(
    "validate_approval",
    "Validate approval input",
    () => validateApproveInput(body),
  ) ?? validateApproveInput(body);
  const tasks = await logger?.step(
    "split_rooms",
    "Split rooms for clip processing",
    () => splitRoomsForProcessing(blueprint_id, room_photos),
    { outputSummary: { room_count: room_photos.length } },
  ) ?? splitRoomsForProcessing(blueprint_id, room_photos);

  const statusError = await logger?.step(
    "set_blueprint_ready",
    "Set blueprint status to ready",
    async () => {
      const { error } = await supabase
        .from("blueprints")
        .update({ status: "ready" })
        .eq("id", blueprint_id);
      return error;
    },
    { inputSummary: { blueprint_id } },
  ) ?? (await supabase
    .from("blueprints")
    .update({ status: "ready" })
    .eq("id", blueprint_id)).error;

  if (statusError) {
    throw new Error(statusError.message);
  }

  for (const task of tasks) {
    const start = await logger?.step(
      `start_clip:${task.label}`,
      `Start clip: ${task.label}`,
      () =>
        startRoomClip({
          blueprint_id: task.blueprint_id,
          label: task.label,
          r2_url: task.r2_url,
          image_urls: task.image_urls,
          higgsfield_prompt: task.higgsfield_prompt,
          duration_seconds: task.duration_seconds,
        }),
      {
        inputSummary: {
          label: task.label,
          image_count: task.image_urls.length,
          duration_seconds: task.duration_seconds,
        },
      },
    ) ?? await startRoomClip({
      blueprint_id: task.blueprint_id,
      label: task.label,
      r2_url: task.r2_url,
      image_urls: task.image_urls,
      higgsfield_prompt: task.higgsfield_prompt,
      duration_seconds: task.duration_seconds,
    });

    const falModel = resolveFalModelForTask(task.image_urls);

    if (!start.success || !start.job_id) {
      await upsertProcessingFile(serviceSupabase, task, {
        fal_job_id: start.job_id,
        fal_model: falModel,
        status: "error",
        error_message: start.error ?? "Failed to start clip generation",
        diagnostics: start.diagnostics,
      });
      continue;
    }

    await upsertProcessingFile(serviceSupabase, task, {
      fal_job_id: start.job_id,
      fal_model: falModel,
      status: "processing",
      diagnostics: start.diagnostics,
    });
  }

  return buildApproveResult(tasks.length);
}

async function upsertProcessingFile(
  serviceSupabase: SupabaseClient,
  task: RoomClipTask,
  options: {
    fal_job_id?: string;
    fal_model: string;
    status: "processing" | "error";
    error_message?: string;
    diagnostics?: unknown;
  },
) {
  const metadata: MediaFileMetadata = {
    label: task.label,
    fal_job_id: options.fal_job_id,
    fal_model: options.fal_model,
    image_urls: task.image_urls,
    diagnostics: options.diagnostics ?? null,
    source: "media-pipeline",
  };

  const { data: existing } = await serviceSupabase
    .from("media_files")
    .select("id")
    .eq("job_id", task.blueprint_id)
    .eq("file_name", task.file_name)
    .maybeSingle();

  const row = {
    job_id: task.blueprint_id,
    file_name: task.file_name,
    r2_key: task.r2_key,
    r2_url: task.r2_url,
    file_size: 0,
    duration_seconds: task.duration_seconds,
    metadata,
    status: options.status,
    error_message: options.error_message ?? null,
  };

  if (existing?.id) {
    const { error } = await serviceSupabase
      .from("media_files")
      .update(row)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await serviceSupabase.from("media_files").insert(row);
  if (error) throw new Error(error.message);
}

export async function runAdvanceClips(
  serviceSupabase: SupabaseClient,
  blueprintId: string,
  execution?: PipelineRunLogger,
): Promise<AdvanceClipsResult> {
  const logger = execution ?? null;
  const { data: rows, error } = await logger?.step(
    "load_processing_clips",
    "Load processing clips",
    () =>
      serviceSupabase
        .from("media_files")
        .select(
          "id, job_id, file_name, r2_key, r2_url, duration_seconds, metadata, status",
        )
        .eq("job_id", blueprintId)
        .eq("status", "processing"),
    { inputSummary: { blueprint_id: blueprintId } },
  ) ?? await serviceSupabase
    .from("media_files")
    .select(
      "id, job_id, file_name, r2_key, r2_url, duration_seconds, metadata, status",
    )
    .eq("job_id", blueprintId)
    .eq("status", "processing");

  if (error) {
    throw new Error(error.message);
  }

  const processing = (rows ?? []) as ProcessingMediaFile[];
  let done = 0;
  let failed = 0;

  for (const row of processing) {
    const metadata = row.metadata ?? {};
    const falJobId = metadata.fal_job_id;
    const falModel = metadata.fal_model ?? resolveFalModelForTask(
      metadata.image_urls ?? [row.r2_url],
    );
    const label = metadata.label ?? row.file_name;

    if (!falJobId) {
      await recordClipFailureStep(
        logger,
        label,
        "Missing fal_job_id in metadata",
      );
      await markFileFailed(
        serviceSupabase,
        row.id,
        "Missing fal_job_id in metadata",
        metadata,
      );
      failed += 1;
      continue;
    }

    const status = await logger?.step(
      `check_clip_status:${label}`,
      `Check clip status: ${label}`,
      () => checkRoomClipStatus(falJobId, label, falModel),
      { inputSummary: { label, fal_model: falModel } },
    ) ?? await checkRoomClipStatus(falJobId, label, falModel);

    if (status.status === "processing") {
      continue;
    }

    if (status.status === "failed") {
      await recordClipFailureStep(
        logger,
        label,
        status.error ?? "Clip generation failed",
      );
      await markFileFailed(
        serviceSupabase,
        row.id,
        status.error ?? "Clip generation failed",
        {
          ...metadata,
          diagnostics: status.diagnostics ?? metadata.diagnostics,
        },
      );
      failed += 1;
      continue;
    }

    const result = await logger?.step(
      `fetch_clip_result:${label}`,
      `Fetch clip result: ${label}`,
      () => fetchRoomClipResult(falJobId, label, falModel),
      { inputSummary: { label, fal_model: falModel } },
    ) ?? await fetchRoomClipResult(falJobId, label, falModel);

    if (!result.success || !result.video_url) {
      await recordClipFailureStep(
        logger,
        label,
        result.error ?? "No video URL from fal",
      );
      await markFileFailed(
        serviceSupabase,
        row.id,
        result.error ?? "No video URL from fal",
        {
          ...metadata,
          diagnostics: result.diagnostics ?? metadata.diagnostics,
        },
      );
      failed += 1;
      continue;
    }
    const videoUrl = result.video_url;

    try {
      const archived = await logger?.step(
        `archive_clip:${label}`,
        `Archive clip to R2: ${label}`,
        () => archiveRemoteFileToR2(videoUrl, row.r2_key),
        { inputSummary: { label, r2_key: row.r2_key } },
      ) ?? await archiveRemoteFileToR2(videoUrl, row.r2_key);
      const { error: updateError } = await serviceSupabase
        .from("media_files")
        .update({
          r2_url: archived.r2_url || getPublicR2Url(row.r2_key),
          file_size: archived.file_size,
          status: "done",
          error_message: null,
          metadata: {
            ...metadata,
            diagnostics: result.diagnostics ?? metadata.diagnostics,
            archived_to_r2: true,
            source: "media-pipeline",
          },
        })
        .eq("id", row.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      done += 1;
    } catch (archiveErr) {
      const message =
        archiveErr instanceof Error ? archiveErr.message : "Archive failed";
      await recordClipFailureStep(logger, label, message);
      await markFileFailed(serviceSupabase, row.id, message, metadata);
      failed += 1;
    }
  }

  const still_processing = processing.length - done - failed;

  return {
    advanced: done + failed,
    done,
    failed,
    still_processing,
  };
}

async function recordClipFailureStep(
  logger: PipelineRunLogger | null,
  label: string,
  message: string,
) {
  if (!logger?.enabled) return;

  await logger
    .step(
      `clip_failed:${label}`,
      `Clip failed: ${label}`,
      () => {
        throw new Error(message);
      },
      { inputSummary: { label } },
    )
    .catch(() => undefined);
}

async function markFileFailed(
  serviceSupabase: SupabaseClient,
  id: string,
  errorMessage: string,
  metadata: MediaFileMetadata,
) {
  const { error } = await serviceSupabase
    .from("media_files")
    .update({
      status: "error",
      error_message: errorMessage,
      metadata: {
        ...metadata,
        source: "media-pipeline",
      },
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
