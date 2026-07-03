import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";

type CreateUploadJobBody = {
  blueprint_id?: string;
};

export async function POST(request: Request) {
  const { supabase, user, error } = await requireAuth();
  if (error || !user) return error;

  let body: CreateUploadJobBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { blueprint_id } = body;
  if (!blueprint_id) {
    return NextResponse.json({ error: "Missing blueprint_id" }, { status: 400 });
  }

  const { data: blueprint, error: blueprintError } = await supabase
    .from("blueprints")
    .select("id, property_name, status")
    .eq("id", blueprint_id)
    .single();

  if (blueprintError || !blueprint) {
    return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
  }

  const { data: clips, error: clipsError } = await supabase
    .from("media_files")
    .select("id, file_name, file_size, r2_key, r2_url, duration_seconds, metadata")
    .eq("job_id", blueprint_id)
    .eq("status", "done");

  if (clipsError) {
    return NextResponse.json({ error: clipsError.message }, { status: 500 });
  }

  if (!clips || clips.length === 0) {
    return NextResponse.json(
      { error: "No completed clips found for this blueprint" },
      { status: 400 },
    );
  }

  const jobId = crypto.randomUUID();

  const { error: jobError } = await supabase.from("media_jobs").insert({
    id: jobId,
    uploaded_by: user.id,
    property_name: blueprint.property_name,
    content_type: "short",
    category: "house_tour",
    keywords: [],
    notes: `Generated from blueprint ${blueprint_id}`,
    status: "pending",
  });

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  for (const clip of clips) {
    const { error: fileError } = await supabase.from("media_files").insert({
      job_id: jobId,
      file_name: clip.file_name,
      file_size: clip.file_size,
      r2_key: clip.r2_key,
      r2_url: clip.r2_url,
      duration_seconds: clip.duration_seconds,
      metadata: clip.metadata,
      status: "uploaded",
    });

    if (fileError) {
      return NextResponse.json({ error: fileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    job_id: jobId,
    clip_count: clips.length,
    transcription_warnings: [],
    transcription_note:
      "Automatic transcription is not implemented yet. Clips were copied into the upload job.",
  });
}
