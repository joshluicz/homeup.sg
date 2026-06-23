"use client";

import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PlaybookVideoCardProps = {
  thumbnailSrc: string;
  title: string;
  duration?: string;
  onClick: () => void;
  className?: string;
};

/** Vertical video card — full thumbnail visible (no crop), 9:16 frame with letterboxing if needed. */
export function PlaybookVideoCard({
  thumbnailSrc,
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
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition hover:border-primary-600/40 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[9/16] w-full bg-neutral-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/50 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-60" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-transform group-hover:scale-105">
            <Play className="h-5 w-5 translate-x-0.5 fill-primary-600 text-primary-600" />
          </div>
        </div>
        {duration && (
          <span className="absolute bottom-3 right-3 rounded-md bg-neutral-950/75 px-2 py-0.5 text-xs font-medium text-white">
            {duration}
          </span>
        )}
      </div>
      <p className="px-4 py-4 text-sm font-bold leading-snug text-neutral-900 group-hover:text-primary-700">
        {title}
      </p>
    </button>
  );
}

type PlaybookVideoModalFrameProps = {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
};

export function PlaybookVideoModalFrame({ children, title, onClose }: PlaybookVideoModalFrameProps) {
  return (
    <div
      className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-neutral-950 shadow-xl"
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
      <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-950 p-1">
        <div className="aspect-[9/16] max-h-[min(75vh,640px)] w-full">{children}</div>
      </div>
      <div className="shrink-0 bg-white px-5 py-4">
        <p className="text-sm font-bold leading-snug text-neutral-900">{title}</p>
      </div>
    </div>
  );
}
