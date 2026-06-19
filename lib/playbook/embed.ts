/** Extract a YouTube video ID from any YouTube URL form, or "" if not YouTube. */
export function youtubeId(url?: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || (u.pathname.match(/\/(shorts|embed)\/([^/?]+)/)?.[2] ?? "");
    }
    if (u.hostname.includes("youtu.be")) return u.pathname.replace(/^\//, "");
  } catch {}
  return "";
}

/** Derive a thumbnail image URL from a YouTube video URL, or "" if not derivable. */
export function videoThumbnail(url?: string): string {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

/** Pick a usable thumbnail: a real custom image if given, else derive one from the video URL.
 *  Treats a stored YouTube/Vimeo *page* URL as "no image" (a common data-entry mistake). */
export function resolveThumbnail(thumbnail?: string, videoUrl?: string): string {
  const t = (thumbnail || "").trim();
  const looksLikeVideoPage = /youtube\.com\/(watch|shorts|embed)|youtu\.be\/|vimeo\.com/i.test(t);
  if (t && !looksLikeVideoPage) return t;
  return videoThumbnail(videoUrl) || t;
}

/** True if the URL points at a direct video file (play with <video>, not an <iframe> embed). */
export function isDirectVideoFile(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?|$)/i.test(u.pathname)) return true;
    if (u.pathname.includes("/storage/v1/object/")) return true; // Supabase Storage object
  } catch {}
  return false;
}

/** Convert a YouTube/Vimeo watch URL into an embeddable player URL. */
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video${u.pathname}`;
    }
  } catch {}
  return url;
}
