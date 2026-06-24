import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const HIGGSFIELD_API_KEY = Deno.env.get("HIGGSFIELD_API_KEY")!;
const HIGGSFIELD_BASE = "https://api.higgsfield.ai";

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504, 522, 524]);
const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000];

type ClipRequest = {
  blueprint_id: string;
  label: string;
  r2_url: string;
  higgsfield_prompt: string;
  duration_seconds: number;
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
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${HIGGSFIELD_BASE}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${HIGGSFIELD_API_KEY}`,
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
      });

      const text = await res.text();

      if (!res.ok) {
        const message = trimHiggsfieldError(text, res.status);
        if (isRetryableStatus(res.status) && attempt < MAX_ATTEMPTS - 1) {
          await sleep(RETRY_DELAYS_MS[attempt] ?? 20_000);
          continue;
        }
        throw new Error(`Higgsfield ${path} ${res.status}: ${message}`);
      }

      return text ? JSON.parse(text) : {};
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const retryable =
        lastError.message.includes("522") ||
        lastError.message.includes("timed out") ||
        lastError.message.includes("503") ||
        lastError.message.includes("502");

      if (retryable && attempt < MAX_ATTEMPTS - 1) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 20_000);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error(`Higgsfield ${path} failed after retries`);
}

function extractMediaId(result: Record<string, unknown>): string {
  const mediaId =
    result.media_id ??
    result.id ??
    (result.data as { id?: string } | undefined)?.id;

  if (!mediaId || typeof mediaId !== "string") {
    throw new Error(
      "No media_id in Higgsfield response: " + JSON.stringify(result).slice(0, 300),
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
    throw new Error(`Higgsfield media upload PUT ${putRes.status}: ${text.slice(0, 300)}`);
  }

  await higgsfieldRequest(`/v1/media/${mediaId}/upload`, {
    method: "POST",
  }).catch(() => {
    // Some Higgsfield flows finalize automatically after PUT.
  });

  return mediaId;
}

async function importImage(url: string): Promise<string> {
  try {
    return await importImageFromUrl(url);
  } catch (primaryError) {
    console.warn("upload/url failed, trying batch upload fallback:", primaryError);

    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      throw primaryError;
    }

    const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    const bytes = new Uint8Array(await imageRes.arrayBuffer());
    return await uploadImageBytes(bytes, contentType);
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

async function pollJob(jobId: string, maxAttempts = 24): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(15_000);

    let result: Record<string, unknown>;
    try {
      result = await higgsfieldRequest(`/v1/generation/video/${jobId}`);
    } catch {
      continue;
    }

    const status = String(result.status ?? "").toLowerCase();

    if (status === "completed" || status === "complete" || status === "done") {
      const videoUrl =
        (result.results as { url?: string }[] | undefined)?.[0]?.url ??
        (result.results as { result_url?: string }[] | undefined)?.[0]
          ?.result_url ??
        result.result_url ??
        result.output_url ??
        (result.output as { media_url?: string[] } | undefined)?.media_url?.[0];

      if (!videoUrl || typeof videoUrl !== "string") {
        throw new Error(
          "Completed but no video URL: " + JSON.stringify(result).slice(0, 300),
        );
      }

      return videoUrl;
    }

    if (status === "failed" || status === "error") {
      throw new Error("Higgsfield job failed: " + JSON.stringify(result).slice(0, 300));
    }
  }

  throw new Error(`Job ${jobId} did not complete after ${maxAttempts} polls`);
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

  const { blueprint_id, label, r2_url, higgsfield_prompt, duration_seconds } =
    body;

  if (!blueprint_id || !label || !r2_url || !higgsfield_prompt) {
    return jsonResponse({
      success: false,
      error: "Missing required fields: blueprint_id, label, r2_url, higgsfield_prompt",
    }, 400);
  }

  try {
    console.log(`[${label}] Importing image: ${r2_url}`);
    const mediaId = await importImage(r2_url);
    console.log(`[${label}] media_id: ${mediaId}`);

    console.log(`[${label}] Submitting Kling 3.0 job`);
    const jobId = await submitJob(mediaId, higgsfield_prompt, duration_seconds ?? 10);
    console.log(`[${label}] job_id: ${jobId}`);

    console.log(`[${label}] Polling...`);
    const videoUrl = await pollJob(jobId);
    console.log(`[${label}] Done: ${videoUrl}`);

    return jsonResponse({
      success: true,
      label,
      higgsfield_job_id: jobId,
      video_url: videoUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${label}] Error:`, message);

    const retryable =
      message.includes("timed out") ||
      message.includes("522") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("504");

    return jsonResponse({
      success: false,
      label,
      error: message,
      retryable,
    });
  }
});
