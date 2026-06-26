"use client";

import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
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

const PX_PER_MS = 0.045;
const DRAG_CLICK_THRESHOLD = 6;

/**
 * Display A — slow auto-scrolling horizontal video strip.
 *
 * Driven by a CSS transform (not native `scrollLeft`) so the motion stays
 * smooth on mobile WebKit, where JS-driven `scrollLeft` fights the browser's
 * own touch/momentum compositor. Manual swiping is reimplemented on top of
 * Pointer Events so mouse drag, touch, and pen all behave identically.
 */
export function PlaybookAutoVideoRail({
  videos,
  className,
  onVideoSelect,
  resolveHref,
  inverted = false,
  intro,
}: PlaybookAutoVideoRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const draggedDistanceRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  const loopItems = useMemo(() => {
    if (videos.length === 0) return [];
    return [...videos, ...videos];
  }, [videos]);

  useEffect(() => {
    offsetRef.current = 0;
    if (trackRef.current) trackRef.current.style.transform = "translate3d(0,0,0)";
  }, [videos]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || videos.length < 2) return;

    let raf = 0;
    lastTimeRef.current = null;

    const tick = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (!pausedRef.current && !draggingRef.current) {
        offsetRef.current -= PX_PER_MS * delta;
        const loopWidth = track.scrollWidth / 2;
        if (loopWidth > 0 && Math.abs(offsetRef.current) >= loopWidth) {
          offsetRef.current += loopWidth;
        }
        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
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

  function normalizeOffsetAfterDrag() {
    const track = trackRef.current;
    if (!track) return;
    const loopWidth = track.scrollWidth / 2;
    if (loopWidth <= 0) return;
    while (offsetRef.current <= -loopWidth) offsetRef.current += loopWidth;
    while (offsetRef.current > 0) offsetRef.current -= loopWidth;
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    pausedRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    draggedDistanceRef.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    draggedDistanceRef.current = Math.abs(delta);
    offsetRef.current = dragStartOffsetRef.current + delta;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    pausedRef.current = false;
    normalizeOffsetAfterDrag();
  }

  function guardClick<E extends { preventDefault: () => void }>(e: E) {
    if (draggedDistanceRef.current > DRAG_CLICK_THRESHOLD) {
      e.preventDefault();
      return true;
    }
    return false;
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
        className="-mx-4 cursor-grab touch-pan-y overflow-hidden px-4 pb-2 active:cursor-grabbing sm:-mx-0 sm:px-0"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          if (!draggingRef.current) pausedRef.current = false;
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => {
          if (draggingRef.current) endDrag();
        }}
      >
        <div ref={trackRef} className="flex w-max gap-4 will-change-transform">
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
                    onClick={() => {
                      if (draggedDistanceRef.current > DRAG_CLICK_THRESHOLD) return;
                      onVideoSelect(video);
                    }}
                    className="group/tile block w-[148px] text-left transition duration-200 sm:w-[168px] hover:-translate-y-0.5"
                    aria-label={`Watch ${video.title}`}
                  >
                    {tile}
                  </button>
                ) : (
                  <Link
                    href={hrefFor(video)}
                    onClick={guardClick}
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
    </div>
  );
}
