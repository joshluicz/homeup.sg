import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { fal } from "npm:@fal-ai/client";

const FAL_MODEL = "fal-ai/bytedance/seedance/v1/pro/image-to-video";

type ClipRequest = {
  blueprint_id: string;
  label: string;
  r2_url: string;
  higgsfield_prompt: string;
  duration_seconds?: number;
};

type ClipDiagnostics = {
  stage: "generate" | "completed";
  elapsed_ms: number;
  last_error?: string;
  fal_request_id?: string;
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
    const apiKey = Deno.env.get("FAL_API_KEY");
    if (!apiKey) {
      throw new Error("FAL_API_KEY is not configured.");
    }

    fal.config({ credentials: apiKey });

    console.log(`[${label}] Generating clip with fal Seedance`);
    const result = await fal.subscribe(FAL_MODEL, {
      input: {
        image_url: r2_url,
        prompt: higgsfield_prompt,
        duration: Math.min(duration_seconds ?? 5, 10),
        aspect_ratio: "9:16",
        motion_strength: 0.7,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`[${label}] Status:`, update.status);
      },
    });

    const videoUrl = result.data?.video?.url;
    if (!videoUrl) {
      throw new Error(
        "No video URL in fal response: " +
          JSON.stringify(result.data).slice(0, 300),
      );
    }

    console.log(`[${label}] Done: ${videoUrl}`);

    const diagnostics: ClipDiagnostics = {
      stage: "completed",
      elapsed_ms: Date.now() - startedAt,
      fal_request_id: result.requestId,
    };

    return jsonResponse({
      success: true,
      label,
      higgsfield_job_id: result.requestId,
      video_url: videoUrl,
      diagnostics,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${label}] Error:`, message);

    return jsonResponse({
      success: false,
      label,
      error: message,
      retryable: isRetryableError(message),
      diagnostics: {
        stage: "generate",
        elapsed_ms: Date.now() - startedAt,
        last_error: message,
      } satisfies ClipDiagnostics,
    });
  }
});
