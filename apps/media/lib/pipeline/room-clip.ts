import { fal } from "@fal-ai/client";

export const FAL_MODEL_SEEDANCE_2 = "bytedance/seedance-2.0/reference-to-video";
export const FAL_MODEL_SEEDANCE_15 =
  "fal-ai/bytedance/seedance/v1.5/pro/image-to-video";

const SUBMIT_TIMEOUT_MS = 30_000;
const STATUS_TIMEOUT_MS = 12_000;
const RESULT_TIMEOUT_MS = 30_000;

export type RoomClipRequest = {
  blueprint_id: string;
  label: string;
  r2_url?: string;
  image_urls?: string[];
  higgsfield_prompt: string;
  duration_seconds?: number;
  fal_model?: string;
};

export type RoomClipDiagnostics = {
  stage: "submit" | "status" | "result" | "completed";
  elapsed_ms: number;
  last_error?: string;
  fal_request_id?: string;
  fal_status?: string;
  fal_model?: string;
  image_count?: number;
};

export type RoomClipStartResult = {
  success: boolean;
  status: "processing" | "failed";
  label: string;
  job_id?: string;
  error?: string;
  retryable?: boolean;
  diagnostics?: RoomClipDiagnostics;
};

export type RoomClipStatusResult = {
  success: boolean;
  status: "processing" | "completed" | "failed";
  label: string;
  job_id: string;
  error?: string;
  retryable?: boolean;
  diagnostics?: RoomClipDiagnostics;
};

export type RoomClipResult = {
  success: boolean;
  label: string;
  job_id: string;
  video_url?: string;
  error?: string;
  retryable?: boolean;
  diagnostics?: RoomClipDiagnostics;
};

function getFalApiKey(): string {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_API_KEY is not configured.");
  }
  return apiKey;
}

function configureFal(): void {
  fal.config({ credentials: getFalApiKey() });
}

function resolveImageUrls(body: RoomClipRequest): string[] {
  const fromArray = body.image_urls?.filter(
    (url) => typeof url === "string" && url.trim() !== "",
  );
  if (fromArray?.length) {
    return fromArray;
  }
  if (body.r2_url?.trim()) {
    return [body.r2_url.trim()];
  }
  return [];
}

function resolveFalModel(body: RoomClipRequest, imageUrls: string[]): string {
  if (
    body.fal_model === FAL_MODEL_SEEDANCE_2 ||
    body.fal_model === FAL_MODEL_SEEDANCE_15
  ) {
    return body.fal_model;
  }
  if (imageUrls.length >= 1) {
    return FAL_MODEL_SEEDANCE_2;
  }
  return FAL_MODEL_SEEDANCE_2;
}

function countImageReferences(prompt: string): number {
  const matches = prompt.match(/@Image(\d+)/gi);
  if (!matches) return 0;
  const distinct = new Set(
    matches.map((token) => token.toLowerCase().replace(/[^0-9]/g, "")),
  );
  return distinct.size;
}

function buildImageReferenceList(imageCount: number): string {
  return Array.from(
    { length: imageCount },
    (_, index) => `@Image${index + 1}`,
  ).join(", ");
}

function buildSeedancePrompt(roomPrompt: string, imageCount = 1): string {
  const trimmed = roomPrompt.trim();
  const refsPresent = countImageReferences(trimmed);

  if (imageCount > 1) {
    if (refsPresent >= imageCount) {
      return trimmed;
    }

    const refList = buildImageReferenceList(imageCount);
    const multiRefSuffix =
      `Use all reference images (${refList}) as equally weighted factual sources — ` +
      `they are different angles of the same room. ` +
      `Move the camera smoothly across the viewpoints shown in ${refList}, ` +
      `treating them as one continuous space. ` +
      `Do not invent walls, doors, windows, furniture, or rooms not shown in ${refList}. ` +
      `Keep architecture, layout, colours, and objects identical to the references. ` +
      `Empty room, no people.`;

    return `${trimmed} ${multiRefSuffix}`;
  }

  if (
    /photo-faithful|reference image|reference viewpoints|source photo|@Image\d/i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  const singleRefSuffix =
    "Photo-faithful animation only: slow camera movement across the visible scene in @Image1. " +
    "Do not invent new walls, doors, windows, furniture, or rooms. " +
    "Keep architecture, layout, colours, and objects identical to the reference image. " +
    "Empty room, no people.";

  return `${trimmed} ${singleRefSuffix}`;
}

function buildSeedance2Input(
  image_urls: string[],
  higgsfield_prompt: string,
  duration_seconds?: number,
) {
  const prompt = buildSeedancePrompt(higgsfield_prompt, image_urls.length);
  const clipDuration = Math.min(Math.max(duration_seconds ?? 6, 4), 8);

  return {
    image_urls,
    prompt,
    duration: String(clipDuration),
    aspect_ratio: "9:16",
    resolution: "720p",
    generate_audio: false,
  };
}

function buildSeedance15Input(
  r2_url: string,
  higgsfield_prompt: string,
  duration_seconds?: number,
) {
  const prompt = buildSeedancePrompt(higgsfield_prompt, 1);
  const clipDuration = Math.min(Math.max(duration_seconds ?? 6, 4), 8);
  const wantsPan = /\bpan\b/i.test(higgsfield_prompt);
  const wantsStatic =
    /\b(static|locked[- ]?off|tripod|no movement)\b/i.test(higgsfield_prompt);

  return {
    image_url: r2_url,
    prompt,
    duration: String(clipDuration),
    aspect_ratio: "9:16",
    resolution: "720p",
    generate_audio: false,
    camera_fixed: wantsStatic || !wantsPan,
  };
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      );
    }),
  ]);
}

function isRetryableError(message: string): boolean {
  return (
    message.includes("timed out") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("504") ||
    message.includes("429")
  );
}

function normalizeFalStatus(status: unknown): string {
  return String(status ?? "").toUpperCase();
}

function extractVideoUrl(
  data: Record<string, unknown> | undefined,
): string | null {
  const video = data?.video as { url?: string } | undefined;
  return typeof video?.url === "string" ? video.url : null;
}

export async function startRoomClip(
  body: RoomClipRequest,
): Promise<RoomClipStartResult> {
  const { blueprint_id, label, higgsfield_prompt, duration_seconds } = body;
  const image_urls = resolveImageUrls(body);
  const startedAt = Date.now();

  if (!blueprint_id || !label || !higgsfield_prompt) {
    return {
      success: false,
      status: "failed",
      label: label ?? "room",
      error: "Missing required fields: blueprint_id, label, higgsfield_prompt",
    };
  }

  if (image_urls.length === 0) {
    return {
      success: false,
      status: "failed",
      label,
      error:
        "Missing required image: provide image_urls or r2_url with at least one URL",
    };
  }

  const falModel = resolveFalModel(body, image_urls);

  try {
    configureFal();

    const input =
      falModel === FAL_MODEL_SEEDANCE_2
        ? buildSeedance2Input(image_urls, higgsfield_prompt, duration_seconds)
        : buildSeedance15Input(
            image_urls[0],
            higgsfield_prompt,
            duration_seconds,
          );

    const submitted = await withTimeout(
      fal.queue.submit(falModel, { input }),
      SUBMIT_TIMEOUT_MS,
      "fal submit",
    );

    return {
      success: true,
      status: "processing",
      label,
      job_id: submitted.request_id,
      diagnostics: {
        stage: "submit",
        elapsed_ms: Date.now() - startedAt,
        fal_request_id: submitted.request_id,
        fal_model: falModel,
        image_count: image_urls.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: "failed",
      label,
      error: message,
      retryable: isRetryableError(message),
      diagnostics: {
        stage: "submit",
        elapsed_ms: Date.now() - startedAt,
        last_error: message,
        fal_model: falModel,
        image_count: image_urls.length,
      },
    };
  }
}

export async function checkRoomClipStatus(
  requestId: string,
  label: string,
  falModel: string,
): Promise<RoomClipStatusResult> {
  const startedAt = Date.now();

  try {
    configureFal();

    const status = await withTimeout(
      fal.queue.status(falModel, { requestId, logs: false }),
      STATUS_TIMEOUT_MS,
      "fal status",
    );
    const falStatus = normalizeFalStatus(status.status);

    if (falStatus === "FAILED") {
      return {
        success: false,
        status: "failed",
        label,
        job_id: requestId,
        error: "fal job failed",
        retryable: true,
        diagnostics: {
          stage: "status",
          elapsed_ms: Date.now() - startedAt,
          fal_request_id: requestId,
          fal_status: falStatus,
          fal_model: falModel,
        },
      };
    }

    if (falStatus === "COMPLETED") {
      return {
        success: true,
        status: "completed",
        label,
        job_id: requestId,
        diagnostics: {
          stage: "status",
          elapsed_ms: Date.now() - startedAt,
          fal_request_id: requestId,
          fal_status: falStatus,
          fal_model: falModel,
        },
      };
    }

    return {
      success: true,
      status: "processing",
      label,
      job_id: requestId,
      diagnostics: {
        stage: "status",
        elapsed_ms: Date.now() - startedAt,
        fal_request_id: requestId,
        fal_status: falStatus || "IN_PROGRESS",
        fal_model: falModel,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: "processing",
      label,
      job_id: requestId,
      error: message,
      retryable: isRetryableError(message),
      diagnostics: {
        stage: "status",
        elapsed_ms: Date.now() - startedAt,
        fal_request_id: requestId,
        last_error: message,
        fal_model: falModel,
      },
    };
  }
}

export async function fetchRoomClipResult(
  requestId: string,
  label: string,
  falModel: string,
): Promise<RoomClipResult> {
  const startedAt = Date.now();

  try {
    configureFal();

    const result = await withTimeout(
      fal.queue.result(falModel, { requestId }),
      RESULT_TIMEOUT_MS,
      "fal result",
    );
    const videoUrl = extractVideoUrl(
      result.data as Record<string, unknown> | undefined,
    );

    if (!videoUrl) {
      throw new Error(
        "No video URL in fal result: " +
          JSON.stringify(result.data).slice(0, 300),
      );
    }

    return {
      success: true,
      label,
      job_id: requestId,
      video_url: videoUrl,
      diagnostics: {
        stage: "completed",
        elapsed_ms: Date.now() - startedAt,
        fal_request_id: requestId,
        fal_model: falModel,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      label,
      job_id: requestId,
      error: message,
      retryable: isRetryableError(message),
      diagnostics: {
        stage: "result",
        elapsed_ms: Date.now() - startedAt,
        fal_request_id: requestId,
        last_error: message,
        fal_model: falModel,
      },
    };
  }
}

export function resolveFalModelForTask(
  imageUrls: string[],
  falModel?: string,
): string {
  return resolveFalModel(
    { blueprint_id: "", label: "", higgsfield_prompt: "", fal_model: falModel },
    imageUrls,
  );
}
