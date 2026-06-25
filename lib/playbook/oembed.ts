import { getVideoPlatform, youtubeThumbnailCandidates } from "@/lib/playbook/embed";

const UA =
  "Mozilla/5.0 (compatible; HomeUPBot/1.0; +https://homeup.sg/playbook)";

type OEmbedPayload = {
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
};

/** Fetch a poster image URL from TikTok / Vimeo oEmbed (YouTube uses static URLs). */
export async function fetchOEmbedThumbnail(videoUrl: string): Promise<string> {
  const url = videoUrl.trim();
  if (!url) return "";

  const platform = getVideoPlatform(url);
  if (platform === "youtube") return youtubeThumbnailCandidates(url)[0] ?? "";
  if (platform !== "tiktok" && platform !== "vimeo") return "";

  try {
    const endpoint =
      platform === "vimeo"
        ? `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
        : `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

    const res = await fetch(endpoint, {
      headers: { Accept: "application/json", "User-Agent": UA },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });

    if (!res.ok) return "";
    const data = (await res.json()) as OEmbedPayload;
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url.trim() : "";
  } catch {
    return "";
  }
}

export async function enrichVideoThumbnails<T extends { videoUrl: string; thumbnail: string }>(
  items: T[],
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.thumbnail.trim()) return item;
      const thumbnail = await fetchOEmbedThumbnail(item.videoUrl);
      return thumbnail ? { ...item, thumbnail } : item;
    }),
  );
}
