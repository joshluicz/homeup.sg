import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function buildListingImagePath(listingId: string, ext: string): string {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return `listings/${listingId}/${filename}`;
}

export async function uploadListingImageFromBuffer(
  supabase: SupabaseClient,
  listingId: string,
  buffer: Uint8Array | ArrayBuffer,
  ext: string,
): Promise<string> {
  const path = buildListingImagePath(listingId, ext);
  const body = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, body, {
      upsert: false,
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-images").getPublicUrl(path);

  return publicUrl;
}
