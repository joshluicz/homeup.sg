import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

function buildListingImagePath(listingId: string, ext: string): string {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return `listings/${listingId}/${filename}`;
}

export async function uploadListingImageFromBuffer(
  supabase: SupabaseClient,
  listingId: string,
  buffer: Buffer,
  ext: string,
): Promise<string> {
  const path = buildListingImagePath(listingId, ext);

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, buffer, {
      upsert: false,
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-images").getPublicUrl(path);

  return publicUrl;
}

export async function uploadListingImage(
  listingId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadListingImageFromBuffer(supabase, listingId, buffer, ext);
}
