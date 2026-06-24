import { NextResponse } from "next/server";
import { archiveRemoteFileToR2, getPublicR2Url, isValidR2Key } from "@/lib/r2";
import { requireAuth } from "@/lib/supabase/auth";

type SyncBody = {
  blueprint_id?: string;
};

function isHostedOnR2(r2Url: string | null, r2Key: string | null): boolean {
  if (!r2Url || !r2Key) return false;
  try {
    return r2Url.startsWith(getPublicR2Url(r2Key));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  let body: SyncBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { blueprint_id } = body;
  if (!blueprint_id) {
    return NextResponse.json({ error: "Missing blueprint_id" }, { status: 400 });
  }

  const { data: clips, error: clipsError } = await supabase
    .from("media_files")
    .select("id, r2_key, r2_url, status")
    .eq("job_id", blueprint_id)
    .eq("status", "done");

  if (clipsError) {
    return NextResponse.json({ error: clipsError.message }, { status: 500 });
  }

  const synced: string[] = [];
  const skipped: string[] = [];
  const failures: { id: string; error: string }[] = [];

  for (const clip of clips ?? []) {
    if (!clip.r2_key || !isValidR2Key(clip.r2_key) || !clip.r2_url) {
      skipped.push(clip.id);
      continue;
    }

    if (isHostedOnR2(clip.r2_url, clip.r2_key)) {
      skipped.push(clip.id);
      continue;
    }

    try {
      const archived = await archiveRemoteFileToR2(clip.r2_url, clip.r2_key);
      const { error: updateError } = await supabase
        .from("media_files")
        .update({
          r2_url: archived.r2_url,
          file_size: archived.file_size,
        })
        .eq("id", clip.id);

      if (updateError) {
        failures.push({ id: clip.id, error: updateError.message });
        continue;
      }

      synced.push(clip.id);
    } catch (err) {
      failures.push({
        id: clip.id,
        error: err instanceof Error ? err.message : "Archive failed",
      });
    }
  }

  return NextResponse.json({
    synced_count: synced.length,
    skipped_count: skipped.length,
    failures,
  });
}
