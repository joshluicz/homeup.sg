"use client";

import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { getVideoPlatform, resolveVideoThumbnailCandidatesForDisplay } from "@/lib/playbook/embed";
import { cn } from "@/lib/utils";

// Module-level cache so looped rail items (same URL appears twice) share one request.
// Stores either the resolved string or the in-flight Promise to avoid duplicate fetches.
const _oembedCache = new Map<string, string | Promise<string>>();

function fetchOembedCached(videoUrl: string): Promise<string> {
  const hit = _oembedCache.get(videoUrl);
  if (typeof hit === "string") return Promise.resolve(hit);
  if (hit) return hit as Promise<string>;
  const p: Promise<string> = fetch(`/api/video-oembed?url=${encodeURIComponent(videoUrl)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (typeof d?.thumbnail_url === "string" ? d.thumbnail_url.trim() : ""))
    .catch(() => "")
    .then((url) => {
      _oembedCache.set(videoUrl, url);
      return url;
    });
  _oembedCache.set(videoUrl, p);
  return p;
}

type PlaybookVideoThumbnailProps = {
  thumbnail?: string;
  videoUrl?: string;
  title: string;
  className?: string;
  imgClassName?: string;
};

export function PlaybookVideoThumbnail({
  thumbnail,
  videoUrl,
  title,
  className,
  imgClassName,
}: PlaybookVideoThumbnailProps) {
  const [oembedThumb, setOembedThumb] = useState("");
  // True when we should try fetching a fresh oEmbed thumbnail.
  // Starts true when there's no stored thumbnail; set true later if stored candidates all fail.
  const [shouldFetchOembed, setShouldFetchOembed] = useState(!thumbnail?.trim());
  const platform = getVideoPlatform(videoUrl);

  // Fetch oEmbed when: (a) no stored thumbnail, or (b) all stored candidates failed.
  // YouTube thumbnails are derived directly from the video ID — no oEmbed needed.
  useEffect(() => {
    if (!videoUrl?.trim() || platform === "youtube" || !shouldFetchOembed) return;

    let cancelled = false;
    fetchOembedCached(videoUrl).then((url) => {
      if (!cancelled && url) setOembedThumb(url);
    });

    return () => {
      cancelled = true;
    };
  }, [videoUrl, platform, shouldFetchOembed]);

  const candidates = useMemo(() => {
    const base = resolveVideoThumbnailCandidatesForDisplay(thumbnail, videoUrl);
    if (oembedThumb && !base.includes(oembedThumb)) return [oembedThumb, ...base];
    return base;
  }, [thumbnail, videoUrl, oembedThumb]);

  const [index, setIndex] = useState(0);
  const src = candidates[index];

  // Reset index whenever the candidate list changes (e.g. oEmbed thumb arrives).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setIndex(0);
  }, [candidates.join("|")]);

  // Full reset when source props change (different video in same slot).
  useEffect(() => {
    setIndex(0);
    setOembedThumb("");
    setShouldFetchOembed(!thumbnail?.trim());
  }, [thumbnail, videoUrl]);

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-800 text-neutral-400",
          className,
        )}
        aria-hidden
      >
        <Play className="h-8 w-8 text-white/70" />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden bg-neutral-900", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        className={cn("block h-full w-full object-cover", imgClassName)}
        onError={() => {
          setIndex((current) => {
            const next = current + 1;
            // All stored candidates failed — request a fresh thumbnail via oEmbed.
            // Handles expired TikTok signed CDN URLs (p16-*-sign.tiktokcdn.com).
            if (next >= candidates.length) setShouldFetchOembed(true);
            return next;
          });
        }}
      />
    </div>
  );
}
