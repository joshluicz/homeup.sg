"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  onVideoSelect?: (video: AutoVideoRailItem) => void;
  resolveHref?: (video: AutoVideoRailItem) => string;
  inverted?: boolean;
  intro?: ReactNode;
};

const TILE_W_PX = 164;
const SCROLL_SPEED = 0.5; // px per frame (~30px/s at 60fps)
const RESUME_DELAY_MS = 2000;

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
  const rafRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollRef = useRef<number>(0);

  const loopItems = useMemo(() => {
    if (videos.length === 0) return [];
    return [...videos, ...videos, ...videos];
  }, [videos]);

  const clearResume = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pauseNow = useCallback(() => {
    pausedRef.current = true;
    clearResume();
  }, [clearResume]);

  const scheduleResume = useCallback(
    (delayMs = RESUME_DELAY_MS) => {
      clearResume();
      resumeTimerRef.current = setTimeout(() => {
        pausedRef.current = false;
      }, delayMs);
    },
    [clearResume],
  );

  // Continuous RAF scroll loop.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || videos.length < 2) return;

    const tick = () => {
      if (!pausedRef.current) {
        const loopWidth = el.scrollWidth / 3;
        // Seamless reset: jump back one copy when we reach the end of the first.
        if (el.scrollLeft >= loopWidth * 2) {
          el.scrollLeft -= loopWidth;
        }
        el.scrollLeft += SCROLL_SPEED;
        lastScrollRef.current = el.scrollLeft;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [videos.length]);

  // Detect genuine user scroll and pause temporarily.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const delta = Math.abs(el.scrollLeft - lastScrollRef.current);
      if (delta > 2) {
        // User-initiated scroll (our RAF moves by 0.5px, not >2px at once).
        pauseNow();
        scheduleResume();
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [pauseNow, scheduleResume]);

  if (videos.length === 0) return null;

  function hrefFor(video: AutoVideoRailItem): string {
    if (resolveHref) return resolveHref(video);
    return playbookVideoHref({ slug: video.slug ?? "", videoUrl: video.videoUrl }).href;
  }

  function scrollByDirection(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    pauseNow();
    el.scrollBy({ left: direction * TILE_W_PX * 3, behavior: "smooth" });
    scheduleResume();
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

      <div className="group/rail relative">
        <div
          ref={scrollRef}
          className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mx-0 sm:px-0"
          onMouseEnter={pauseNow}
          onMouseLeave={() => scheduleResume(300)}
          onTouchStart={pauseNow}
          onTouchEnd={() => scheduleResume(RESUME_DELAY_MS)}
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

        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByDirection(-1)}
          className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-neutral-800 shadow-md ring-1 ring-neutral-200 transition hover:bg-white sm:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByDirection(1)}
          className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-neutral-800 shadow-md ring-1 ring-neutral-200 transition hover:bg-white sm:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
