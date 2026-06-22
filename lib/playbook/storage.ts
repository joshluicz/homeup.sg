import type { PlaybookMediaFolder } from "@/lib/playbook/storage-server";

async function uploadPlaybookMediaClient(
  file: File,
  folder: PlaybookMediaFolder,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/admin/playbook/upload", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || "Upload failed");
  }

  return data.url;
}

export async function uploadPlaybookArticleImage(file: File): Promise<string> {
  return uploadPlaybookMediaClient(file, "articles");
}

export async function uploadPlaybookVideoFile(file: File): Promise<string> {
  return uploadPlaybookMediaClient(file, "videos");
}

export async function uploadPlaybookThumbnail(file: File): Promise<string> {
  return uploadPlaybookMediaClient(file, "thumbnails");
}
