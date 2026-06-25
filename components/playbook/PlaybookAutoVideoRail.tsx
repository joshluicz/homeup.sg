"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import Link from "next/link";
import { playbookVideoHref } from "@/lib/playbook/embed";
import { PlaybookVideoBrowseTile } from "@/components/playbook/PlaybookVideoBrowseTile";
import { cn } from "@/lib/utils";

export type AutoVideoRailItem = {
  id: string;
  title: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: string;
  slug?: string;
};

type PlaybookAutoVideoRailProps = {
  videos: AutoVideoRailItem[];
  className?: string;
  /** When set, tiles open the modal handler instead of navigating away. */
  onVideoSelect?: (video: AutoVideoRailItem) => void;
  resolveHref?: (video: AutoVideoRailItem) => string;
  /** Light title text for dark section backgrounds. */
  inverted?: boolean;
  /** Optional content above the “Swipe to explore” label. */
  intro?: ReactNode;
};

/** Display A — slow auto-scrolling horizontal video strip. */
export function PlaybookAutoVideoRail({
  videos,
  className,
  onVideoSelect,
  resolveHref,
  inverted = false,
  intro,
}: PlaybookAutoVideoRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const loopItems = useMemo(() => {
    if (videos.length === 0) return [];
    return [...videos, ...videos];
  }, [videos]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || videos.length < 2) return;

    let raf = 0;
    const tick = () => {
      if (!pausedRef.current) {
        el.scrollLeft += 0.45;
        const loopWidth = el.scrollWidth / 2;
        if (loopWidth > 0 && el.scrollLeft >= loopWidth) {
          el.scrollLeft -= loopWidth;
        }
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [videos.length]);

  if (videos.length === 0) return null;

  function hrefFor(video: AutoVideoRailItem): string {
    if (resolveHref) return resolveHref(video);
    return playbookVideoHref({ slug: video.slug ?? "", videoUrl: video.videoUrl }).href;
  }

  return (
    <div className={cn("relative", className)}>
      {intro}

      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Swipe to explore
        <span className="ml-2 inline-block animate-pulse" aria-hidden>
          →
        </span>
      </p>

      <div
        ref={scrollRef}
        className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mx-0 sm:px-0"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        onTouchStart={() => {
          pausedRef.current = true;
        }}
        onTouchEnd={() => {
          pausedRef.current = false;
        }}
      >
        {loopItems.map((video, index) => {
          const tile = (
            <PlaybookVideoBrowseTile
              thumbnail={video.thumbnail}
              videoUrl={video.videoUrl}
              title={video.title}
              duration={video.duration}
              variant="rail"
              titleInverted={inverted}
            />
          );

          return (
            <div key={`${video.id}-${index}`} className="relative shrink-0 py-1">
              {onVideoSelect ? (
                <button
                  type="button"
                  onClick={() => onVideoSelect(video)}
                  className="group/tile block w-[148px] text-left transition duration-200 sm:w-[168px] hover:-translate-y-0.5"
                  aria-label={`Watch ${video.title}`}
                >
                  {tile}
                </button>
              ) : (
                <Link
                  href={hrefFor(video)}
                  className="group/tile block w-[148px] transition duration-200 sm:w-[168px] hover:-translate-y-0.5"
                  aria-label={`Watch ${video.title}`}
                >
                  {tile}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
