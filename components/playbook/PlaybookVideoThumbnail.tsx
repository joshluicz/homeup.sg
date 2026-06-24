"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { resolveVideoThumbnailCandidatesForDisplay } from "@/lib/playbook/embed";
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
  const candidates = useMemo(
    () => resolveVideoThumbnailCandidatesForDisplay(thumbnail, videoUrl),
    [thumbnail, videoUrl],
  );
  const [index, setIndex] = useState(0);
  const src = candidates[index];

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
        alt=""
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
