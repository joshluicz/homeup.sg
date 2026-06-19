import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getPresignedReadUrl } from "@/lib/r2";

const N8N_TRANSCRIBE_WEBHOOK =
  "https://n8n-production-d50a.up.railway.app/webhook/media-job-transcribe";

type TriggerTranscribeBody = {
  job_id?: string;
  r2_key?: string;
};

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: TriggerTranscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { job_id, r2_key } = body;

  if (!job_id || !r2_key) {
    return NextResponse.json(
      { error: "job_id and r2_key are required" },
      { status: 400 },
    );
  }

  try {
    const r2_presigned_url = await getPresignedReadUrl(r2_key);

    const webhookRes = await fetch(N8N_TRANSCRIBE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id, r2_presigned_url }),
    });

    if (!webhookRes.ok) {
      const detail = await webhookRes.text().catch(() => "");
      console.error("n8n transcription webhook failed:", detail);
      return NextResponse.json(
        { error: "Transcription webhook failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to trigger transcription:", err);
    return NextResponse.json(
      { error: "Failed to trigger transcription" },
      { status: 500 },
    );
  }
}
