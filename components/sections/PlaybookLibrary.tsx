"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { X, ExternalLink, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCard } from "@/components/ui/VideoCard";
import type { PlaybookVideo, VideoCategory } from "@/lib/data/playbook";
import { CATEGORY_LABELS, PLAYBOOK_VIDEOS } from "@/lib/data/playbook";
import { createClient } from "@/lib/supabase/client";
import { trackVideoPlay } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface PlaybookLibraryProps {
  videos: PlaybookVideo[];
}

const CATEGORIES: VideoCategory[] = ["all", "selling", "buying", "process", "market", "tips"];

function rowToVideo(row: Record<string, unknown>): PlaybookVideo {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as PlaybookVideo["category"],
    duration: row.duration as string,
    thumbnail: row.thumbnail as string,
    videoUrl: row.video_url as string,
    featured: row.featured as boolean,
    publishedAt: row.published_at as string,
    tags: row.tags as string[],
  };
}

export function PlaybookLibrary({ videos: initialVideos }: PlaybookLibraryProps) {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<PlaybookVideo[]>(initialVideos);
  const [activeCategory, setActiveCategory] = useState<VideoCategory>("all");
  const [activeVideo, setActiveVideo] = useState<PlaybookVideo | null>(null);

  // Always fetch live from Supabase — static build can't use server cookies,
  // so DB videos only appear via this client-side fetch.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("playbook_videos")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return;
        const dbVideos = data.map(rowToVideo);
        const dbSlugs = new Set(dbVideos.map((v) => v.slug));
        const placeholders = PLAYBOOK_VIDEOS.filter((v) => !dbSlugs.has(v.slug));
        // DB videos first, then any placeholders not yet replaced
        setVideos([...dbVideos, ...placeholders]);
      });
  }, []);

  useEffect(() => {
    const videoSlug = searchParams.get("video");
    if (!videoSlug) return;
    const match = videos.find((v) => v.slug === videoSlug);
    if (match) setActiveVideo(match);
  }, [searchParams, videos]);

  const featuredVideos = videos.filter((v) => v.featured);
  const filteredVideos =
    activeCategory === "all"
      ? videos
      : videos.filter((v) => v.category === activeCategory);

  const handlePlay = useCallback((video: PlaybookVideo) => {
    if (video.videoUrl) {
      setActiveVideo(video);
      trackVideoPlay(video.title, video.slug, video.category);
    }
  }, []);

  const closeModal = useCallback(() => setActiveVideo(null), []);

  // Convert a YouTube watch URL to an embeddable URL
  const toEmbedUrl = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
      }
      if (u.hostname.includes("youtu.be")) {
        return `https://www.youtube.com/embed${u.pathname}?autoplay=1&rel=0`;
      }
      if (u.hostname.includes("vimeo.com")) {
        return `https://player.vimeo.com/video${u.pathname}?autoplay=1`;
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <>
      <section className="section-padding bg-white">
        <div className="container-page">

          {/* ── Featured Videos ─────────────────────────────────────────── */}
          {featuredVideos.length > 0 && (
            <div className="mb-16">
              <div className="mb-6 flex items-center gap-2">
                <Star className="h-4 w-4 fill-accent-600 text-accent-600" />
                <h2 className="font-display text-sm font-bold uppercase tracking-widest text-neutral-500">
                  Featured
                </h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {featuredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={handlePlay}
                    featured
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Filter tabs ─────────────────────────────────────────────── */}
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                  activeCategory === cat
                    ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                {CATEGORY_LABELS[cat]}
                {cat !== "all" && (
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      activeCategory === cat
                        ? "bg-white/20 text-white"
                        : "bg-neutral-100 text-neutral-500"
                    )}
                  >
                    {videos.filter((v) => v.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Video grid ──────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} onPlay={handlePlay} />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredVideos.length === 0 && (
            <div className="py-20 text-center text-sm text-neutral-400">
              No videos in this category yet. Check back soon.
            </div>
          )}
        </div>
      </section>

      {/* ── Video Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 px-4 py-8 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-neutral-950 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                aria-label="Close video"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800/80 text-white backdrop-blur-sm transition-colors hover:bg-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Video player */}
              <div className="aspect-video w-full bg-neutral-900">
                <iframe
                  src={toEmbedUrl(activeVideo.videoUrl)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>

              {/* Video info */}
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-400">
                    {CATEGORY_LABELS[activeVideo.category]}
                  </p>
                  <h3 className="mt-1 font-display text-sm font-bold text-white">
                    {activeVideo.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-400">
                    {activeVideo.description}
                  </p>
                </div>
                <a
                  href={activeVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in YouTube
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
