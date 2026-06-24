import { NextResponse } from "next/server";
import { getPresignedReadUrl, isValidR2Key } from "@/lib/r2";
import { requireAuth } from "@/lib/supabase/auth";

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

  if (file.r2_key && isValidR2Key(file.r2_key)) {
    try {
      const presignedUrl = await getPresignedReadUrl(file.r2_key);
      return NextResponse.redirect(presignedUrl);
    } catch (err) {
      console.error("presigned read failed:", err);
    }
  }

  if (file.r2_url) {
    return NextResponse.redirect(file.r2_url);
  }

  return NextResponse.json({ error: "No downloadable URL for clip" }, { status: 404 });
}
