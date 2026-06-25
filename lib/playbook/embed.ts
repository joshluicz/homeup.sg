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
  if (!url?.trim()) return "";

  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/i,
    /tiktok\.com\/embed\/v2\/(\d+)/i,
    /tiktok\.com\/player\/v1\/(\d+)/i,
    /tiktok\.com\/video\/(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  try {
    const u = new URL(url);
    if (!u.hostname.includes("tiktok.com")) return "";
    const pathMatch = u.pathname.match(/\/(\d{10,})(?:\/|$)/);
    return pathMatch?.[1] ?? "";
  } catch {}

  return "";
}

export type VideoPlatform = "youtube" | "tiktok" | "vimeo" | "file" | "unknown";

export function getVideoPlatform(url?: string): VideoPlatform {
  if (!url?.trim()) return "unknown";
  if (isDirectVideoFile(url)) return "file";
  if (/tiktok\.com|vm\.tiktok\.com/i.test(url)) return "tiktok";
  try {
    const host = new URL(url).hostname;
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("vimeo.com")) return "vimeo";
  } catch {}
  return "unknown";
}

export function tiktokHandle(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/tiktok\.com\/@([^/?#]+)/i);
  return match?.[1] ?? null;
}

/** Canonical watch URL on TikTok / YouTube / Vimeo (opens the exact clip). */
export function externalVideoWatchUrl(url: string): string {
  const trimmed = url.trim();

  try {
    const platform = getVideoPlatform(trimmed);
    if (platform === "tiktok") {
      // Always prefer the stored @handle/video/{id} URL — never use /video/{id} alone (redirects elsewhere).
      if (/tiktok\.com\/@[^/]+\/video\/\d+/i.test(trimmed)) {
        const parsed = new URL(trimmed);
        return `${parsed.origin}${parsed.pathname}`;
      }

      const id = tiktokVideoId(trimmed);
      const handle = tiktokHandle(trimmed);
      if (handle && id) {
        return `https://www.tiktok.com/@${handle}/video/${id}`;
      }

      return trimmed.split(/[?#]/)[0];
    }
    if (platform === "youtube") {
      const id = youtubeId(trimmed);
      if (!id) return trimmed.split("?")[0];
      if (/\/shorts\//i.test(trimmed)) return `https://www.youtube.com/shorts/${id}`;
      return `https://www.youtube.com/watch?v=${id}`;
    }
    if (platform === "vimeo") {
      const path = new URL(trimmed).pathname.replace(/\/$/, "");
      return `https://vimeo.com${path}`;
    }
  } catch {}

  return trimmed;
}

/** TikTok on-site player — avoids embed/v2 “Watch now” linking to the wrong place. */
export function toTikTokPlayerEmbedUrl(url: string, autoplay = false): string {
  const id = tiktokVideoId(url);
  if (!id) return url;

  const params = new URLSearchParams({
    loop: "1",
    music_info: "0",
    description: "0",
    rel: "0",
  });
  if (autoplay) params.set("autoplay", "1");

  return `https://www.tiktok.com/player/v1/${id}?${params.toString()}`;
}

export function tiktokProfileUrlFromVideo(url: string): string | null {
  const handle = tiktokHandle(url);
  return handle ? `https://www.tiktok.com/@${handle}` : null;
}

export function externalWatchLabel(_url?: string): string {
  return "Watch now";
}

/** @deprecated All supported platforms now embed on-site; use supportsExternalWatchLink for outbound CTAs. */
export function prefersExternalVideoPlayer(_url?: string): boolean {
  return false;
}

export function playbookVideoHref(video: { slug: string; videoUrl?: string }): {
  href: string;
  external: boolean;
} {
  const slug = video.slug?.trim();
  if (slug && video.videoUrl?.trim()) {
    return { href: `/playbook/watch/${slug}`, external: false };
  }
  return { href: "/playbook", external: false };
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
      return toTikTokPlayerEmbedUrl(url, false);
    }
  } catch {}
  return url;
}
