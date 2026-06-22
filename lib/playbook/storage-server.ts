import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";

export const PLAYBOOK_MEDIA_BUCKET = "playbook-videos";

export type PlaybookMediaFolder = "articles" | "videos" | "thumbnails";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]);

export async function ensurePlaybookMediaBucket(
  supabase: SupabaseClient,
): Promise<void> {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);

  const exists = buckets?.some(
    (bucket) => bucket.id === PLAYBOOK_MEDIA_BUCKET || bucket.name === PLAYBOOK_MEDIA_BUCKET,
  );
  if (exists) return;

  const { error: createError } = await supabase.storage.createBucket(PLAYBOOK_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 104857600,
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(createError.message);
  }
}

function buildPath(folder: PlaybookMediaFolder, filename: string): string {
  return `${folder}/${filename}`;
}

function extensionFromFile(file: File, folder: PlaybookMediaFolder): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) {
    if (fromName === "jpeg") return "jpg";
    if (fromName === "quicktime") return "mov";
    return fromName;
  }
  if (folder === "videos") return "mp4";
  return "jpg";
}

function contentTypeFor(ext: string, folder: PlaybookMediaFolder): string {
  if (folder === "videos") {
    if (ext === "mov") return "video/quicktime";
    if (ext === "webm") return "video/webm";
    return "video/mp4";
  }
  if (ext === "jpg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return folder === "videos" ? "video/mp4" : "image/jpeg";
}

export function validatePlaybookUpload(file: File, folder: PlaybookMediaFolder): string | null {
  if (folder === "videos") {
    if (ALLOWED_VIDEO_TYPES.has(file.type) || /\.(mp4|webm|mov|avi)$/i.test(file.name)) {
      return null;
    }
    return "Please upload an MP4, MOV, or WebM video.";
  }

  if (/\.heic$|\.heif$/i.test(file.name)) {
    return "iPhone HEIC photos are not supported yet. Share the image as JPG or PNG, then upload again.";
  }

  if (ALLOWED_IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
    return null;
  }

  return "Please upload a JPG, PNG, or WebP photo.";
}

export async function uploadPlaybookMediaServer(
  file: File,
  folder: PlaybookMediaFolder,
): Promise<string> {
  const validationError = validatePlaybookUpload(file, folder);
  if (validationError) throw new Error(validationError);

  const supabase = createServiceClient();
  await ensurePlaybookMediaBucket(supabase);

  const ext = extensionFromFile(file, folder);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = buildPath(folder, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(PLAYBOOK_MEDIA_BUCKET).upload(path, buffer, {
    upsert: false,
    contentType: contentTypeFor(ext, folder),
  });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(PLAYBOOK_MEDIA_BUCKET).getPublicUrl(path);

  return publicUrl;
}
