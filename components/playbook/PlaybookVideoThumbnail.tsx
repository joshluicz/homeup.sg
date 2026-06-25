"use client";

import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { getVideoPlatform, resolveVideoThumbnailCandidatesForDisplay } from "@/lib/playbook/embed";
import { cn } from "@/lib/utils";

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
  const platform = getVideoPlatform(videoUrl);

  useEffect(() => {
    if (thumbnail?.trim() || !videoUrl?.trim()) return;
    if (platform === "youtube") return;

    let cancelled = false;
    fetch(`/api/video-oembed?url=${encodeURIComponent(videoUrl)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.thumbnail_url === "string" && data.thumbnail_url) {
          setOembedThumb(data.thumbnail_url);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [thumbnail, videoUrl, platform]);

  const candidates = useMemo(() => {
    const base = resolveVideoThumbnailCandidatesForDisplay(thumbnail, videoUrl);
    if (oembedThumb && !base.includes(oembedThumb)) return [oembedThumb, ...base];
    return base;
  }, [thumbnail, videoUrl, oembedThumb]);

  const [index, setIndex] = useState(0);
  const src = candidates[index];

  useEffect(() => {
    setIndex(0);
  }, [candidates.join("|")]);

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
          setIndex((current) => current + 1);
        }}
      />
    </div>
  );
}
