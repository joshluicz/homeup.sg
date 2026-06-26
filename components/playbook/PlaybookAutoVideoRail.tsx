"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode, type WheelEvent as ReactWheelEvent } from "react";
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
  /** When set, tiles open the modal handler instead of navigating away. */
  onVideoSelect?: (video: AutoVideoRailItem) => void;
  resolveHref?: (video: AutoVideoRailItem) => string;
  /** Light title text for dark section backgrounds. */
  inverted?: boolean;
  /** Optional content above the “Swipe to explore” label. */
  intro?: ReactNode;
};

const PX_PER_MS = 0.045;
/** How long to stay paused after the user stops interacting before auto-scroll resumes. */
const RESUME_DELAY_MS = 900;
/** Cap DOM writes to ~30fps — the drift is slow enough that this looks identical
 *  to 60fps but roughly halves the layout/paint work, which matters on phones. */
const WRITE_INTERVAL_MS = 1000 / 30;

/**
 * Display A — slow auto-scrolling horizontal video strip.
 *
 * Manual scrolling is plain native `overflow-x: auto` — touch swipe,
 * trackpad, mouse wheel, and a scrollbar drag all just work, on every
 * device, for free. The only custom logic is the auto-scroll: it tracks
 * position every frame but only writes `scrollLeft` at ~30fps (capped via
 * WRITE_INTERVAL_MS — the drift is slow enough that this is visually
 * identical to 60fps, and roughly halves layout/paint cost on phones), and
 * pauses for `RESUME_DELAY_MS` after any *user-initiated* scroll (detected
 * via the native `scroll` event, filtering out the ticks the auto-scroll
 * itself causes) so it never fights a swipe,
 * a trackpad gesture, or momentum scrolling.
 */
export function PlaybookAutoVideoRail({
  videos,
  className,
  onVideoSelect,
  resolveHref,
  inverted = false,
  intro,
}: PlaybookAutoVideoRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualOffsetRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const writeAccumRef = useRef(0);

  const loopItems = useMemo(() => {
    if (videos.length === 0) return [];
    return [...videos, ...videos];
  }, [videos]);

  useEffect(() => {
    virtualOffsetRef.current = 0;
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [videos]);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pauseNow = useCallback(() => {
    clearResumeTimer();
    pausedRef.current = true;
  }, [clearResumeTimer]);

  const scheduleResume = useCallback(
    (delayMs: number) => {
      clearResumeTimer();
      resumeTimerRef.current = window.setTimeout(() => {
        const el = scrollRef.current;
        if (el) virtualOffsetRef.current = el.scrollLeft;
        pausedRef.current = false;
        resumeTimerRef.current = null;
      }, delayMs);
    },
    [clearResumeTimer],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || videos.length < 2) return;

    let raf = 0;
    lastTimeRef.current = null;

    const tick = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (!pausedRef.current) {
        virtualOffsetRef.current += PX_PER_MS * delta;
        const loopWidth = el.scrollWidth / 2;
        if (loopWidth > 0 && virtualOffsetRef.current >= loopWidth) {
          virtualOffsetRef.current -= loopWidth;
        }

        writeAccumRef.current += delta;
        if (writeAccumRef.current >= WRITE_INTERVAL_MS) {
          writeAccumRef.current = 0;
          const next = Math.round(virtualOffsetRef.current);
          if (next !== el.scrollLeft) el.scrollLeft = next;
        }
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    // `scroll` doesn't bubble, and React's onScroll prop has proven unreliable
    // here in testing — attach directly so user-scroll detection always fires.
    const handleScroll = () => {
      // A flag-based "was this scroll caused by our own tick()?" check is racy —
      // the native `scroll` event is async, so a newer tick can re-arm the flag
      // before an older write's event fires. Comparing against where the
      // auto-scroll itself last put scrollLeft is reliable regardless of timing.
      if (Math.abs(el.scrollLeft - Math.round(virtualOffsetRef.current)) <= 2) return;

      // A genuine user scroll (touch, trackpad, wheel, scrollbar) — pause and
      // let it settle before resuming the auto-scroll from wherever it ended up.
      pauseNow();
      scheduleResume(RESUME_DELAY_MS);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(raf);
      clearResumeTimer();
      el.removeEventListener("scroll", handleScroll);
    };
  }, [videos.length, pauseNow, scheduleResume, clearResumeTimer]);

  if (videos.length === 0) return null;

  function hrefFor(video: AutoVideoRailItem): string {
    if (resolveHref) return resolveHref(video);
    return playbookVideoHref({ slug: video.slug ?? "", videoUrl: video.videoUrl }).href;
  }

  function handleWheel(e: ReactWheelEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;
    e.preventDefault();
    el.scrollLeft += delta;
  }

  function scrollByDirection(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    pauseNow();
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
    scheduleResume(RESUME_DELAY_MS);
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
          className="-mx-4 flex gap-4 overflow-x-auto scroll-auto px-4 pb-2 scrollbar-none sm:-mx-0 sm:px-0"
          style={{ contain: "layout paint", willChange: "scroll-position" }}
          onWheel={handleWheel}
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
