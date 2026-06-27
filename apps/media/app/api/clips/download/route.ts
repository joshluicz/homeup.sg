import { NextResponse } from "next/server";
import { getPresignedReadUrl, isValidR2Key, r2ObjectExists } from "@/lib/r2";
import { requireAuth } from "@/lib/supabase/auth";

function sanitizeFileName(name: string | null | undefined): string {
  const fallback = "room-clip.mp4";
  if (!name) return fallback;
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned || fallback;
}

export async function GET(request: Request) {
  const { supabase, user, error } = await requireAuth();
  if (error || !user) return error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: file, error: dbError } = await supabase
    .from("media_files")
    .select("id, job_id, file_name, r2_key, r2_url")
    .eq("id", id)
    .single();

  if (dbError || !file) {
    return NextResponse.json({ error: "Clip not found" }, { status: 404 });
  }

  // Resolve a URL that actually serves the video. The r2_key may not exist yet
  // (archive step skipped), so verify before trusting it; otherwise fall back to
  // the stored r2_url (often the fal.media CDN link that the player uses).
  let sourceUrl: string | null = null;

  if (file.r2_key && isValidR2Key(file.r2_key) && (await r2ObjectExists(file.r2_key))) {
    try {
      sourceUrl = await getPresignedReadUrl(file.r2_key);
    } catch (err) {
      console.error("presigned read failed:", err);
    }
  }

  if (!sourceUrl && file.r2_url) {
    sourceUrl = file.r2_url;
  }

  if (!sourceUrl) {
    return NextResponse.json(
      { error: "No downloadable URL for clip" },
      { status: 404 },
    );
  }

  // Proxy the file so we can force a download (Content-Disposition: attachment)
  // regardless of whether the origin is R2 or the fal.media CDN.
  const upstream = await fetch(sourceUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Failed to fetch clip (${upstream.status})` },
      { status: 502 },
    );
  }

  const fileName = sanitizeFileName(file.file_name);
  const contentType = upstream.headers.get("content-type") || "video/mp4";
  const contentLength = upstream.headers.get("content-length");

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "private, no-store",
  });
  if (contentLength) headers.set("Content-Length", contentLength);

  return new NextResponse(upstream.body, { status: 200, headers });
}
