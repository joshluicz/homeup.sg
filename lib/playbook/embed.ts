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
  const candidates = youtubeThumbnailCandidates(url);
  return candidates[0] ?? "";
}

/** Ordered YouTube thumbnail URLs (try next on img error). */
export function youtubeThumbnailCandidates(url?: string): string[] {
  const id = youtubeId(url);
  if (!id) return [];
  return [
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${id}/sddefault.jpg`,
    `https://img.youtube.com/vi/${id}/0.jpg`,
  ];
}

/** Pick a usable thumbnail: a real custom image if given, else derive one from the video URL.
 *  Treats a stored YouTube/Vimeo *page* URL as "no image" (a common data-entry mistake). */
export function resolveThumbnail(thumbnail?: string, videoUrl?: string): string {
  return resolveVideoThumbnailCandidates(thumbnail, videoUrl)[0] ?? "";
}

/** Map mirrored Supabase storage URLs to same-origin paths (see next.config rewrites). */
export function toProxiedVideoThumbnailUrl(url: string): string {
  const match = url.match(/\/playbook\/video-thumbnails\/([^/?#]+)$/i);
  if (match?.[1]) return `/playbook/thumbs/${match[1]}`;
  return url;
}

function normalizeThumbnailCandidate(url: string): string {
  return url.trim();
}

/** Thumbnail candidates for in-app display (same-origin proxy for mirrored Supabase files). */
export function resolveVideoThumbnailCandidatesForDisplay(
  thumbnail?: string,
  videoUrl?: string,
): string[] {
  const expanded: string[] = [];
  for (const url of resolveVideoThumbnailCandidates(thumbnail, videoUrl)) {
    if (/\/playbook\/video-thumbnails\//i.test(url)) {
      expanded.push(toProxiedVideoThumbnailUrl(url));
      expanded.push(url);
    } else {
      expanded.push(url);
    }
  }
  return [...new Set(expanded.filter(Boolean))];
}

/** All thumbnail URLs to try for a playbook video card (custom → YouTube fallbacks). */
export function resolveVideoThumbnailCandidates(
  thumbnail?: string,
  videoUrl?: string,
): string[] {
  const t = (thumbnail || "").trim();
  const looksLikeVideoPage =
    /youtube\.com\/(watch|shorts|embed)|youtu\.be\/|vimeo\.com/i.test(t) &&
    !/supabase\.co\/storage\//i.test(t);
  const candidates: string[] = [];

  if (t && !looksLikeVideoPage) candidates.push(normalizeThumbnailCandidate(t));
  candidates.push(...youtubeThumbnailCandidates(videoUrl));

  return [...new Set(candidates.filter(Boolean))];
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

/** Extract a TikTok video ID from a TikTok URL, or "" if not TikTok. */
export function tiktokVideoId(url?: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (!u.hostname.includes("tiktok.com")) return "";
    const match = u.pathname.match(/\/video\/(\d+)/);
    return match?.[1] ?? "";
  } catch {}
  return "";
}

/** Convert a YouTube/Vimeo/TikTok watch URL into an embeddable player URL. */
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id =
        u.searchParams.get("v") ||
        u.pathname.match(/\/(shorts|embed)\/([^/?]+)/)?.[2] ||
        "";
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video${u.pathname}`;
    }
    if (u.hostname.includes("tiktok.com")) {
      const id = tiktokVideoId(url);
      return id ? `https://www.tiktok.com/embed/v2/${id}` : url;
    }
  } catch {}
  return url;
}
