import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "playbook-videos";

function buildArticleImagePath(ext: string): string {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return `articles/${filename}`;
}

export async function uploadPlaybookArticleImageFromBuffer(
  supabase: SupabaseClient,
  buffer: Buffer | Uint8Array | ArrayBuffer,
  ext: string,
): Promise<string> {
  const path = buildArticleImagePath(ext);
  const body = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    upsert: false,
    contentType,
  });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function uploadPlaybookArticleImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadPlaybookArticleImageFromBuffer(supabase, buffer, ext);
}
