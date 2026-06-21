"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { isDirectVideoFile, toEmbedUrl } from "@/lib/playbook/embed";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { cn } from "@/lib/utils";

export function PlaybookStickyVideo({ video }: { video: PlaybookVideo }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!video.videoUrl?.trim()) return;

    const hero = document.getElementById("playbook-article-hero-media");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!dismissed) setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [video.videoUrl, dismissed]);

  if (!video.videoUrl?.trim() || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out",
        "inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[min(100%,22rem)]",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none",
      )}
      aria-hidden={!visible}
    >
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-neutral-950/5">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
          <p className="truncate text-sm font-semibold text-neutral-800">{video.title}</p>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              setVisible(false);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
            aria-label="Close floating video"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="aspect-video bg-neutral-950">
          {isDirectVideoFile(video.videoUrl) ? (
            <video
              src={video.videoUrl}
              title={video.title}
              controls
              playsInline
              className="h-full w-full"
            />
          ) : (
            <iframe
              src={toEmbedUrl(video.videoUrl)}
              title={`${video.title} (mini player)`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
