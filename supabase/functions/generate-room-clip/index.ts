import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { fal } from "npm:@fal-ai/client";

const FAL_MODEL = "fal-ai/bytedance/seedance/v1.5/pro/image-to-video";
const SUBMIT_TIMEOUT_MS = 30_000;
const STATUS_TIMEOUT_MS = 12_000;
const RESULT_TIMEOUT_MS = 30_000;

type ClipAction = "start" | "status" | "result" | "poll";

type ClipRequest = {
  action?: ClipAction;
  blueprint_id?: string;
  label?: string;
  r2_url?: string;
  higgsfield_prompt?: string;
  duration_seconds?: number;
  job_id?: string;
  request_id?: string;
};

type ClipDiagnostics = {
  stage: "submit" | "status" | "result" | "completed";
  elapsed_ms: number;
  last_error?: string;
  fal_request_id?: string;
  fal_status?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
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

function getFalApiKey(): string {
  const apiKey = Deno.env.get("FAL_API_KEY");
  if (!apiKey) {
    throw new Error("FAL_API_KEY is not configured.");
  }
  return apiKey;
}

function configureFal(): void {
  fal.config({ credentials: getFalApiKey() });
}

function buildFalInput(
  r2_url: string,
  higgsfield_prompt: string,
  duration_seconds?: number,
) {
  const prompt = buildSeedancePrompt(higgsfield_prompt);
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

function buildSeedancePrompt(roomPrompt: string): string {
  const trimmed = roomPrompt.trim();
  const fidelitySuffix =
    "Photo-faithful animation only: slow camera movement across the visible scene in the reference image. " +
    "Do not invent new walls, doors, windows, furniture, or rooms. " +
    "Keep architecture, layout, colours, and objects identical to the source photo. " +
    "Empty room, no people.";

  if (/photo-faithful|reference image|source photo/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed} ${fidelitySuffix}`;
}

function resolveAction(body: ClipRequest): ClipAction {
  if (body.action === "start") return "start";
  if (body.action === "status") return "status";
  if (body.action === "result") return "result";
  if (body.action === "poll" || body.job_id || body.request_id) {
    return "status";
  }
  return "start";
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function normalizeFalStatus(status: unknown): string {
  return String(status ?? "").toUpperCase();
}

function extractVideoUrl(data: Record<string, unknown> | undefined): string | null {
  const video = data?.video as { url?: string } | undefined;
  return typeof video?.url === "string" ? video.url : null;
}

async function handleStart(body: ClipRequest): Promise<Response> {
  const { blueprint_id, label, r2_url, higgsfield_prompt, duration_seconds } =
    body;

  if (!blueprint_id || !label || !r2_url || !higgsfield_prompt) {
    return jsonResponse(
      {
        success: false,
        error:
          "Missing required fields: blueprint_id, label, r2_url, higgsfield_prompt",
      },
      400,
    );
  }

  const startedAt = Date.now();

  try {
    configureFal();

    console.log(`[${label}] Submitting fal Seedance 1.5 Pro job`);
    const submitted = await Promise.race([
      fal.queue.submit(FAL_MODEL, {
        input: buildFalInput(r2_url, higgsfield_prompt, duration_seconds),
      }),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("fal submit timed out after 30s")),
          SUBMIT_TIMEOUT_MS,
        );
      }),
    ]);
    const request_id = submitted.request_id;

    console.log(`[${label}] request_id: ${request_id}`);

    return jsonResponse({
      success: true,
      status: "processing",
      label,
      job_id: request_id,
      higgsfield_job_id: request_id,
      diagnostics: {
        stage: "submit",
        elapsed_ms: Date.now() - startedAt,
        fal_request_id: request_id,
      } satisfies ClipDiagnostics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${label}] Start error:`, message);

    return jsonResponse({
      success: false,
      label,
      error: message,
      retryable: isRetryableError(message),
      diagnostics: {
        stage: "submit",
        elapsed_ms: Date.now() - startedAt,
        last_error: message,
      } satisfies ClipDiagnostics,
    });
  }
}

async function handleStatus(body: ClipRequest): Promise<Response> {
  const requestId = body.job_id ?? body.request_id;
  const label = body.label ?? "room";

  if (!requestId) {
    return jsonResponse({ success: false, error: "Missing job_id" }, 400);
  }

  const startedAt = Date.now();

  try {
    configureFal();

    const status = await withTimeout(
      fal.queue.status(FAL_MODEL, { requestId, logs: false }),
      STATUS_TIMEOUT_MS,
      "fal status",
    );
    const falStatus = normalizeFalStatus(status.status);
    console.log(`[${label}] Status: ${falStatus}`);

    if (falStatus === "FAILED") {
      return jsonResponse({
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
        } satisfies ClipDiagnostics,
      });
    }

    if (falStatus === "COMPLETED") {
      return jsonResponse({
        success: true,
        status: "completed",
        label,
        job_id: requestId,
        higgsfield_job_id: requestId,
        diagnostics: {
          stage: "status",
          elapsed_ms: Date.now() - startedAt,
          fal_request_id: requestId,
          fal_status: falStatus,
        } satisfies ClipDiagnostics,
      });
    }

    return jsonResponse({
      success: true,
      status: "processing",
      label,
      job_id: requestId,
      diagnostics: {
        stage: "status",
        elapsed_ms: Date.now() - startedAt,
        fal_request_id: requestId,
        fal_status: falStatus || "IN_PROGRESS",
      } satisfies ClipDiagnostics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${label}] Status error:`, message);

    return jsonResponse({
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
      } satisfies ClipDiagnostics,
    });
  }
}

async function handleResult(body: ClipRequest): Promise<Response> {
  const requestId = body.job_id ?? body.request_id;
  const label = body.label ?? "room";

  if (!requestId) {
    return jsonResponse({ success: false, error: "Missing job_id" }, 400);
  }

  const startedAt = Date.now();

  try {
    configureFal();

    const result = await withTimeout(
      fal.queue.result(FAL_MODEL, { requestId }),
      RESULT_TIMEOUT_MS,
      "fal result",
    );
    const videoUrl = extractVideoUrl(result.data as Record<string, unknown> | undefined);

    if (!videoUrl) {
      throw new Error(
        "No video URL in fal result: " +
          JSON.stringify(result.data).slice(0, 300),
      );
    }

    return jsonResponse({
      success: true,
      status: "completed",
      label,
      job_id: requestId,
      higgsfield_job_id: requestId,
      video_url: videoUrl,
      diagnostics: {
        stage: "completed",
        elapsed_ms: Date.now() - startedAt,
        fal_request_id: requestId,
      } satisfies ClipDiagnostics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${label}] Result error:`, message);

    return jsonResponse({
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
      } satisfies ClipDiagnostics,
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  let body: ClipRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  const action = resolveAction(body);

  switch (action) {
    case "start":
      return await handleStart(body);
    case "status":
      return await handleStatus(body);
    case "result":
      return await handleResult(body);
    default:
      return await handleStart(body);
  }
});
