import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const HIGGSFIELD_API_KEY = Deno.env.get("HIGGSFIELD_API_KEY")!;
const HIGGSFIELD_BASE = "https://api.higgsfield.ai";

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504, 522, 524]);
const START_MAX_ATTEMPTS = 2;
const START_RETRY_DELAYS_MS = [1_500, 4_000];
const REQUEST_TIMEOUT_MS = 25_000;

type ClipAction = "start" | "poll";

type ClipRequest = {
  action?: ClipAction;
  blueprint_id?: string;
  label?: string;
  r2_url?: string;
  higgsfield_prompt?: string;
  duration_seconds?: number;
  job_id?: string;
};

type ClipDiagnostics = {
  stage:
    | "auth_smoke_test"
    | "import_image"
    | "submit_job"
    | "poll_job"
    | "completed";
  attempt_count: number;
  used_batch_fallback: boolean;
  elapsed_ms: number;
  last_error?: string;
  poll_status?: string;
};

function trimHiggsfieldError(text: string, status: number): string {
  if (
    status === 522 ||
    text.includes("522") ||
    text.toLowerCase().includes("connection timed out")
  ) {
    return "Higgsfield timed out importing the room photo. Their API may be overloaded — wait a minute and retry.";
  }
  if (text.startsWith("<!DOCTYPE") || text.includes("<html")) {
    return `Higgsfield API error (${status}). Try again shortly.`;
  }
  return text.slice(0, 500);
}

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUSES.has(status);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function higgsfieldRequest(
  path: string,
  options: RequestInit = {},
  maxAttempts = START_MAX_ATTEMPTS,
  retryDelays = START_RETRY_DELAYS_MS,
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${HIGGSFIELD_BASE}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${HIGGSFIELD_API_KEY}`,
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
      });

      clearTimeout(timeout);
      const text = await res.text();

      if (!res.ok) {
        const message = trimHiggsfieldError(text, res.status);
        if (isRetryableStatus(res.status) && attempt < maxAttempts - 1) {
          await sleep(retryDelays[attempt] ?? 4_000);
          continue;
        }
        throw new Error(`Higgsfield ${path} ${res.status}: ${message}`);
      }

      return text ? JSON.parse(text) : {};
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error : new Error(String(error));
      const retryable =
        lastError.name === "AbortError" ||
        lastError.message.includes("522") ||
        lastError.message.includes("timed out") ||
        lastError.message.includes("503") ||
        lastError.message.includes("502");

      if (retryable && attempt < maxAttempts - 1) {
        await sleep(retryDelays[attempt] ?? 4_000);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error(`Higgsfield ${path} failed after retries`);
}

async function runAuthSmokeTest(): Promise<Response> {
  const startedAt = Date.now();
  const res = await fetch(`${HIGGSFIELD_BASE}/v1/media/upload/url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HIGGSFIELD_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://example.invalid/smoke-test.jpg",
      type: "image",
    }),
  });

  const text = await res.text();
  const elapsedMs = Date.now() - startedAt;

  if (res.status === 401 || res.status === 403) {
    return jsonResponse(
      {
        ok: false,
        auth_valid: false,
        status: res.status,
        elapsed_ms: elapsedMs,
        message: "Higgsfield authentication failed. Check HIGGSFIELD_API_KEY.",
        raw: text.slice(0, 300),
      },
      200,
    );
  }

  return jsonResponse(
    {
      ok: true,
      auth_valid: true,
      status: res.status,
      elapsed_ms: elapsedMs,
      message:
        "Higgsfield key is accepted (this smoke test may still return 4xx/5xx for the dummy URL).",
      raw: text.slice(0, 300),
    },
    200,
  );
}

function extractMediaId(result: Record<string, unknown>): string {
  const mediaId =
    result.media_id ??
    result.id ??
    (result.data as { id?: string } | undefined)?.id;

  if (!mediaId || typeof mediaId !== "string") {
    throw new Error(
      "No media_id in Higgsfield response: " +
        JSON.stringify(result).slice(0, 300),
    );
  }

  return mediaId;
}

async function importImageFromUrl(url: string): Promise<string> {
  const result = await higgsfieldRequest("/v1/media/upload/url", {
    method: "POST",
    body: JSON.stringify({ url, type: "image" }),
  });
  return extractMediaId(result);
}

async function uploadImageBytes(
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const batch = await higgsfieldRequest("/v1/media/batch", {
    method: "POST",
    body: JSON.stringify({ type: "image", content_type: contentType }),
  });

  const mediaId = extractMediaId(batch);
  const uploadUrl =
    (batch.upload_url as string | undefined) ??
    (batch.url as string | undefined);

  if (!uploadUrl) {
    throw new Error(
      "No upload_url in Higgsfield batch response: " +
        JSON.stringify(batch).slice(0, 300),
    );
  }

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
  });

  if (!putRes.ok) {
    const text = await putRes.text();
    throw new Error(
      `Higgsfield media upload PUT ${putRes.status}: ${text.slice(0, 300)}`,
    );
  }

  await higgsfieldRequest(`/v1/media/${mediaId}/upload`, {
    method: "POST",
  }).catch(() => {
    // Some Higgsfield flows finalize automatically after PUT.
  });

  return mediaId;
}

async function importImage(url: string): Promise<{ mediaId: string; usedBatchFallback: boolean }> {
  try {
    const mediaId = await importImageFromUrl(url);
    return { mediaId, usedBatchFallback: false };
  } catch (primaryError) {
    console.warn("upload/url failed, trying batch upload fallback:", primaryError);

    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      throw primaryError;
    }

    const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    const bytes = new Uint8Array(await imageRes.arrayBuffer());
    const mediaId = await uploadImageBytes(bytes, contentType);
    return { mediaId, usedBatchFallback: true };
  }
}

async function submitJob(
  mediaId: string,
  prompt: string,
  durationSeconds: number,
): Promise<string> {
  const duration = Math.min(Math.max(durationSeconds, 3), 10);
  const result = await higgsfieldRequest("/v1/generation/video", {
    method: "POST",
    body: JSON.stringify({
      model: "kling3_0",
      prompt,
      duration,
      aspect_ratio: "9:16",
      sound: "off",
      medias: [{ role: "start_image", value: mediaId }],
    }),
  });

  const jobId =
    result.id ??
    result.job_id ??
    (result.jobs as { id?: string }[] | undefined)?.[0]?.id;

  if (!jobId || typeof jobId !== "string") {
    throw new Error(
      "No job_id in submit response: " + JSON.stringify(result).slice(0, 300),
    );
  }

  return jobId;
}

function extractVideoUrl(result: Record<string, unknown>): string | null {
  const videoUrl =
    (result.results as { url?: string }[] | undefined)?.[0]?.url ??
    (result.results as { result_url?: string }[] | undefined)?.[0]
      ?.result_url ??
    result.result_url ??
    result.output_url ??
    (result.output as { media_url?: string[] } | undefined)?.media_url?.[0];

  return typeof videoUrl === "string" ? videoUrl : null;
}

async function checkJobStatus(jobId: string): Promise<{
  status: "processing" | "completed" | "failed";
  video_url?: string;
  error?: string;
  raw_status?: string;
}> {
  const result = await higgsfieldRequest(
    `/v1/generation/video/${jobId}`,
    {},
    1,
    [],
  );
  const rawStatus = String(result.status ?? "").toLowerCase();

  if (
    rawStatus === "completed" ||
    rawStatus === "complete" ||
    rawStatus === "done"
  ) {
    const videoUrl = extractVideoUrl(result);
    if (!videoUrl) {
      return {
        status: "failed",
        error:
          "Completed but no video URL: " + JSON.stringify(result).slice(0, 300),
        raw_status: rawStatus,
      };
    }
    return { status: "completed", video_url: videoUrl, raw_status: rawStatus };
  }

  if (rawStatus === "failed" || rawStatus === "error") {
    return {
      status: "failed",
      error: "Higgsfield job failed: " + JSON.stringify(result).slice(0, 300),
      raw_status: rawStatus,
    };
  }

  return { status: "processing", raw_status: rawStatus || "unknown" };
}

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
    message.includes("522") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("504")
  );
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
  let stage: ClipDiagnostics["stage"] = "import_image";
  let usedBatchFallback = false;

  try {
    console.log(`[${label}] Importing image: ${r2_url}`);
    const imported = await importImage(r2_url);
    usedBatchFallback = imported.usedBatchFallback;
    console.log(`[${label}] media_id: ${imported.mediaId}`);

    stage = "submit_job";
    console.log(`[${label}] Submitting Kling 3.0 job`);
    const jobId = await submitJob(
      imported.mediaId,
      higgsfield_prompt,
      duration_seconds ?? 10,
    );
    console.log(`[${label}] job_id: ${jobId}`);

    const diagnostics: ClipDiagnostics = {
      stage: "submit_job",
      attempt_count: 1,
      used_batch_fallback: usedBatchFallback,
      elapsed_ms: Date.now() - startedAt,
    };

    return jsonResponse({
      success: true,
      status: "processing",
      label,
      job_id: jobId,
      higgsfield_job_id: jobId,
      diagnostics,
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
        stage,
        attempt_count: 1,
        used_batch_fallback: usedBatchFallback,
        elapsed_ms: Date.now() - startedAt,
        last_error: message,
      } satisfies ClipDiagnostics,
    });
  }
}

async function handlePoll(body: ClipRequest): Promise<Response> {
  const { job_id, label, blueprint_id } = body;

  if (!job_id) {
    return jsonResponse({ success: false, error: "Missing job_id" }, 400);
  }

  const startedAt = Date.now();

  try {
    const result = await checkJobStatus(job_id);

    if (result.status === "completed") {
      return jsonResponse({
        success: true,
        status: "completed",
        label,
        blueprint_id,
        job_id,
        higgsfield_job_id: job_id,
        video_url: result.video_url,
        diagnostics: {
          stage: "completed",
          attempt_count: 1,
          used_batch_fallback: false,
          elapsed_ms: Date.now() - startedAt,
          poll_status: result.raw_status,
        } satisfies ClipDiagnostics,
      });
    }

    if (result.status === "failed") {
      return jsonResponse({
        success: false,
        status: "failed",
        label,
        job_id,
        error: result.error ?? "Higgsfield job failed",
        retryable: false,
        diagnostics: {
          stage: "poll_job",
          attempt_count: 1,
          used_batch_fallback: false,
          elapsed_ms: Date.now() - startedAt,
          poll_status: result.raw_status,
          last_error: result.error,
        } satisfies ClipDiagnostics,
      });
    }

    return jsonResponse({
      success: true,
      status: "processing",
      label,
      job_id,
      diagnostics: {
        stage: "poll_job",
        attempt_count: 1,
        used_batch_fallback: false,
        elapsed_ms: Date.now() - startedAt,
        poll_status: result.raw_status,
      } satisfies ClipDiagnostics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({
      success: false,
      status: "processing",
      label,
      job_id,
      error: message,
      retryable: isRetryableError(message),
      diagnostics: {
        stage: "poll_job",
        attempt_count: 1,
        used_batch_fallback: false,
        elapsed_ms: Date.now() - startedAt,
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

  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("smoke_test") === "higgsfield") {
    return await runAuthSmokeTest();
  }

  let body: ClipRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  const action: ClipAction =
    body.action === "poll" || body.job_id ? "poll" : "start";

  if (action === "poll") {
    return await handlePoll(body);
  }

  return await handleStart(body);
});
