"use client";

import { PlaybookVideoBrowseTile } from "@/components/playbook/PlaybookVideoBrowseTile";
import { PlaybookExclusiveWatch } from "@/components/playbook/PlaybookExclusiveWatch";
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

/** Shared modal shell — title above video, Watch now at bottom. */
export function PlaybookVideoModalFrame({
  videoUrl,
  title,
  thumbnail,
  onClose,
  aspect = "portrait",
}: PlaybookVideoModalFrameProps) {
  return (
    <PlaybookExclusiveWatch
      videoUrl={videoUrl}
      title={title}
      thumbnail={thumbnail}
      autoplay
      aspect={aspect}
      variant="modal"
      onClose={onClose}
      closeLabel="Close"
    />
  );
}
