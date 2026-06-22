import { createClient } from "@/lib/supabase/client";

/** Reuse the listings bucket — it already exists and allows authenticated admin uploads. */
const BUCKET = "listing-images";

type PlaybookMediaFolder = "articles" | "videos" | "thumbnails";

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (!fromName) return "bin";
  if (fromName === "jpeg") return "jpg";
  return fromName;
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|svg|ico|tiff?|heic|heif|avif)$/i.test(file.name);
}

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(file.name);
}

async function uploadPlaybookMedia(
  file: File,
  folder: PlaybookMediaFolder,
): Promise<string> {
  if (folder === "videos") {
    if (!isVideoFile(file)) {
      throw new Error("Please upload a video file (MP4, MOV, or WebM).");
    }
  } else if (!isImageFile(file)) {
    throw new Error("Please upload an image file.");
  }

  const supabase = createClient();
  const ext = extensionFromFile(file);
  const path = `playbook/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function uploadPlaybookArticleImage(file: File): Promise<string> {
  return uploadPlaybookMedia(file, "articles");
}

export async function uploadPlaybookVideoFile(file: File): Promise<string> {
  return uploadPlaybookMedia(file, "videos");
}

export async function uploadPlaybookThumbnail(file: File): Promise<string> {
  return uploadPlaybookMedia(file, "thumbnails");
}
