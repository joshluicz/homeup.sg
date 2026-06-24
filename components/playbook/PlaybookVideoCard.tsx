"use client";

import { X } from "lucide-react";
import { PlaybookVideoBrowseTile } from "@/components/playbook/PlaybookVideoBrowseTile";
import {
  PlaybookEmbeddedVideoPlayer,
  PlaybookExternalWatchButton,
} from "@/components/playbook/PlaybookEmbeddedVideoPlayer";
import { cn } from "@/lib/utils";

type PlaybookVideoCardProps = {
  thumbnail?: string;
  videoUrl?: string;
  title: string;
  duration?: string;
  onClick: () => void;
  className?: string;
};

/** Vertical video card — 9:16 browse tile with visible poster image. */
export function PlaybookVideoCard({
  thumbnail,
  videoUrl,
  title,
  duration,
  onClick,
  className,
}: PlaybookVideoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/tile w-full text-left transition hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`Watch ${title}`}
    >
      <PlaybookVideoBrowseTile
        thumbnail={thumbnail}
        videoUrl={videoUrl}
        title={title}
        duration={duration}
        variant="grid"
      />
    </button>
  );
}

type PlaybookVideoModalFrameProps = {
  videoUrl: string;
  title: string;
  thumbnail?: string;
  onClose: () => void;
  aspect?: "portrait" | "landscape";
};

export function PlaybookVideoModalFrame({
  videoUrl,
  title,
  thumbnail,
  onClose,
  aspect = "portrait",
}: PlaybookVideoModalFrameProps) {
  return (
    <div
      className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800/80 text-white backdrop-blur-sm transition-colors hover:bg-neutral-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex min-h-0 flex-1 flex-col bg-neutral-950 p-1">
        <div
          className={cn(
            "mx-auto w-full",
            aspect === "portrait"
              ? "aspect-[9/16] max-h-[min(75vh,640px)]"
              : "aspect-video max-h-[min(75vh,640px)]",
          )}
        >
          <PlaybookEmbeddedVideoPlayer
            videoUrl={videoUrl}
            title={title}
            thumbnail={thumbnail}
            autoplay
            aspect={aspect}
            showExternalLink={false}
            playerClassName="h-full rounded-xl"
          />
        </div>
      </div>

      <div className="shrink-0 space-y-3 px-5 py-4">
        <p className="text-sm font-bold leading-snug text-neutral-900">{title}</p>
        <PlaybookExternalWatchButton videoUrl={videoUrl} />
      </div>
    </div>
  );
}
