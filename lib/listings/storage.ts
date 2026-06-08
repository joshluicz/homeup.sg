import { createClient } from "@/lib/supabase/client";

export async function uploadListingImage(
  listingId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `listings/${listingId}/${filename}`;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-images").getPublicUrl(path);

  return publicUrl;
}
