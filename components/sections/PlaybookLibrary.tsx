"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { X, Star, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoCard } from "@/components/ui/VideoCard";
import { ArticleBody } from "@/components/sections/ArticleBody";
import { PlaybookEmbeddedVideoPlayer, PlaybookExternalWatchButton } from "@/components/playbook/PlaybookEmbeddedVideoPlayer";
import type { PlaybookVideo, VideoCategory } from "@/lib/data/playbook";
import { CATEGORY_LABELS } from "@/lib/data/playbook";
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
    article: (row.article as string) ?? "",
    faq: ((row.faq as { q: string; a: string }[]) ?? []).filter((f) => f?.q && f?.a),
    metaDescription: (row.meta_description as string) ?? "",
    topic: (row.topic as PlaybookVideo["topic"]) ?? null,
  };
}

export function PlaybookLibrary({ videos: initialVideos }: PlaybookLibraryProps) {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<PlaybookVideo[]>(initialVideos);
  const [activeCategory, setActiveCategory] = useState<VideoCategory>("all");
  const [activeVideo, setActiveVideo] = useState<PlaybookVideo | null>(null);
  const [activeArticle, setActiveArticle] = useState<PlaybookVideo | null>(null);

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
        setVideos(data.map(rowToVideo).filter((v) => v.article?.trim()));
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
    if (!video.videoUrl) return;
    trackVideoPlay(video.title, video.slug, video.category);
    setActiveVideo(video);
  }, []);

  const closeModal = useCallback(() => setActiveVideo(null), []);

  const handleReadGuide = useCallback((video: PlaybookVideo) => {
    setActiveArticle(video);
  }, []);
  const closeArticle = useCallback(() => setActiveArticle(null), []);

  return (
    <>
      <section id="playbook-library" className="section-padding bg-white">
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
                    onReadGuide={handleReadGuide}
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
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={handlePlay}
                  onReadGuide={handleReadGuide}
                />
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
              <div className="bg-neutral-950 p-1">
                <PlaybookEmbeddedVideoPlayer
                  videoUrl={activeVideo.videoUrl}
                  title={activeVideo.title}
                  thumbnail={activeVideo.thumbnail}
                  autoplay
                  aspect="landscape"
                  showExternalLink={false}
                  playerClassName="rounded-xl"
                />
              </div>

              {/* Video info */}
              <div className="space-y-4 px-5 py-4">
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
                <PlaybookExternalWatchButton
                  videoUrl={activeVideo.videoUrl}
                  className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Article Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/85 px-4 py-8 backdrop-blur-sm"
            onClick={closeArticle}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeArticle}
                aria-label="Close article"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="max-h-[85vh] overflow-y-auto px-6 py-8 sm:px-10">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
                  {CATEGORY_LABELS[activeArticle.category]}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">
                  {activeArticle.title}
                </h2>
                {activeArticle.description && (
                  <p className="mt-3 leading-relaxed text-neutral-600">
                    {activeArticle.description}
                  </p>
                )}

                {/* Watch the video */}
                {activeArticle.videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const v = activeArticle;
                      closeArticle();
                      handlePlay(v);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
                  >
                    <Play className="h-3.5 w-3.5 fill-primary-600" />
                    Watch the video
                  </button>
                )}

                {/* Article body */}
                {activeArticle.article && (
                  <div className="mt-6">
                    <ArticleBody markdown={activeArticle.article} />
                  </div>
                )}

                {/* FAQ */}
                {(activeArticle.faq?.length ?? 0) > 0 && (
                  <section className="mt-8 border-t border-neutral-200 pt-6">
                    <h3 className="font-display text-xl font-bold text-neutral-900">
                      Frequently asked questions
                    </h3>
                    <div className="mt-4 divide-y divide-neutral-200">
                      {activeArticle.faq!.map((item, i) => (
                        <details key={i} className="group py-3">
                          <summary className="cursor-pointer list-none font-semibold text-neutral-900">
                            {item.q}
                          </summary>
                          <p className="mt-2 leading-relaxed text-neutral-600">{item.a}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
