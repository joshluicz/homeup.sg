"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlaybookArticleLink } from "@/components/playbook/PlaybookArticleLink";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { pickFeaturedArticles } from "@/lib/playbook/featured-articles";
import { PlaybookArticleThumbnail } from "@/components/playbook/PlaybookArticleThumbnail";
import { resolveArticleThumbnail } from "@/lib/playbook/article-thumbnails";
import { cn } from "@/lib/utils";

const ROTATE_MS = 3200;

type PlaybookFeaturedCarouselProps = {
  articles: PlaybookVideo[];
  /** When true, use the provided list as-is (e.g. pre-shuffled cross-category picks). */
  curated?: boolean;
};

function slideKey(slide: PlaybookVideo, index: number): string {
  return slide.id || slide.slug || `slide-${index}`;
}

export function PlaybookFeaturedCarousel({ articles, curated = false }: PlaybookFeaturedCarouselProps) {
  const slides = useMemo(() => {
    const pool = articles.filter((a) => a.slug && a.article?.trim());
    if (curated) return pool.slice(0, 5);
    return pickFeaturedArticles(pool, 5);
  }, [articles, curated]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex((current) => {
      if (slides.length === 0) return 0;
      return Math.min(current, slides.length - 1);
    });
  }, [slides.length]);

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      setIndex((next + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  const safeIndex = Math.min(index, slides.length - 1);
  const current = slides[safeIndex];
  if (!current?.slug) return null;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-950 shadow-md ring-1 ring-neutral-200/80">
        {slides.map((slide, i) => {
          const isActive = i === safeIndex;
          const slideThumb = resolveArticleThumbnail(slide);

          return (
            <div
              key={slideKey(slide, i)}
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-out",
                isActive ? "z-[1] opacity-100" : "pointer-events-none z-0 opacity-0",
              )}
            >
              <PlaybookArticleLink
                href={`/playbook/${slide.slug}`}
                className="group block h-full w-full"
              >
                {slideThumb ? (
                  <PlaybookArticleThumbnail
                    src={slideThumb}
                    fill
                    loading="eager"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.01]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-400">
                    Featured guide
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary-300">
                    Featured
                  </p>
                  <h3 className="font-display text-lg font-extrabold leading-snug text-white sm:text-xl">
                    {slide.title}
                  </h3>
                </div>
              </PlaybookArticleLink>
            </div>
          );
        })}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous featured article"
              onClick={() => goTo(safeIndex - 1)}
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow transition hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next featured article"
              onClick={() => goTo(safeIndex + 1)}
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow transition hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slideKey(slide, i)}
              type="button"
              aria-label={`Show featured article ${i + 1}`}
              aria-current={i === safeIndex ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === safeIndex ? "w-6 bg-primary-600" : "w-2 bg-neutral-300 hover:bg-neutral-400",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
