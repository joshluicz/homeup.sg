import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { buildR2Key, getPresignedReadUrl, getPresignedUploadUrl } from "@/lib/r2";

type PresignBody = {
  job_id?: string;
  file_name?: string;
  content_type?: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  let body: PresignBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { job_id, file_name, content_type } = body;

  if (!job_id || !file_name || !content_type) {
    return NextResponse.json(
      { error: "job_id, file_name, and content_type are required" },
      { status: 400 },
    );
  }

  if (!UUID_REGEX.test(job_id)) {
    return NextResponse.json({ error: "Invalid job_id" }, { status: 400 });
  }

  const r2_key = buildR2Key(job_id, file_name);

  try {
    const [presigned_url, r2_url] = await Promise.all([
      getPresignedUploadUrl(r2_key, content_type),
      getPresignedReadUrl(r2_key),
    ]);
    return NextResponse.json({ presigned_url, r2_key, r2_url });
  } catch (err) {
    console.error("Failed to generate presigned URL:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
