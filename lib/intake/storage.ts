import type { SupabaseClient } from "@supabase/supabase-js";

export const INTAKE_PHOTO_BUCKET = "listing-photos";
export const MAX_PHOTOS = 10;
/** Optional for now; UI still recommends 3 */
export const MIN_PHOTOS = 0;
export const RECOMMENDED_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Photos must be JPG, PNG, or WebP";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Each photo must be 10MB or smaller";
  }
  return null;
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadIntakePhotos(
  supabase: SupabaseClient,
  intakeId: string,
  files: File[],
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const validationError = validatePhotoFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const ext = extensionForMime(file.type);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const path = `${intakeId}/${filename}`;

    const { error } = await supabase.storage
      .from(INTAKE_PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      throw new Error(`Photo upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(INTAKE_PHOTO_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}
