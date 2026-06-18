"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;
const VISIBLE_THUMB_COUNT = 5;

const THUMB_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

function getVisibleThumbIndices(active: number, total: number, windowSize = VISIBLE_THUMB_COUNT) {
  const size = Math.min(windowSize, total);
  const half = Math.floor(size / 2);
  let start = active - half;
  if (start < 0) start = 0;
  let end = start + size - 1;
  if (end >= total) {
    end = total - 1;
    start = Math.max(0, end - size + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

type ListingImageGalleryProps = {
  images: string[];
  alt: string;
};

export function ListingImageGallery({ images, alt }: ListingImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showAllThumbs, setShowAllThumbs] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const count = images.length;

  const visibleIndices = useMemo(
    () => getVisibleThumbIndices(active, count),
    [active, count],
  );
  const displayIndices = showAllThumbs
    ? Array.from({ length: count }, (_, i) => i)
    : visibleIndices;
  const displayCount = displayIndices.length;
  const canExpandThumbs = count > VISIBLE_THUMB_COUNT;

  useEffect(() => {
    setActive(0);
    setShowAllThumbs(false);
  }, [images]);

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
      setPaused(true);
      window.setTimeout(() => setPaused(false), AUTOPLAY_MS);
    },
    [count],
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  if (count === 0) return null;

  return (
    <div className="space-y-2.5">
      <div
        className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[active]}
          src={images[active]}
          alt={alt}
          className="aspect-[4/3] w-full object-cover transition-opacity duration-300"
          draggable={false}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md backdrop-blur-sm transition-opacity hover:bg-white sm:left-3 sm:h-10 sm:w-10 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md backdrop-blur-sm transition-opacity hover:bg-white sm:right-3 sm:h-10 sm:w-10 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <span className="tabular-nums">{active + 1}</span>
              <span className="text-white/60">/</span>
              <span className="tabular-nums text-white/80">{count}</span>
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50/80 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              All photos
            </span>
            <div className="flex items-center gap-2">
              {canExpandThumbs && (
                <button
                  type="button"
                  onClick={() => setShowAllThumbs((v) => !v)}
                  aria-expanded={showAllThumbs}
                  className="text-[10px] font-semibold text-primary-600 transition-colors hover:text-primary-700"
                >
                  {showAllThumbs ? "Show less" : "Show all"}
                </button>
              )}
              <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums text-neutral-500 ring-1 ring-neutral-200/80">
                {count}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "grid gap-1.5 p-2",
              showAllThumbs ? "grid-cols-5" : (THUMB_COLS[displayCount] ?? "grid-cols-5"),
            )}
          >
            {displayIndices.map((index) => (
              <button
                key={`${images[index]}-${index}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={active === index}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-md bg-neutral-100 transition-all",
                  active === index
                    ? "ring-2 ring-primary-600 ring-offset-1"
                    : "opacity-50 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[index]}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
