"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { createClient } from "@/lib/supabase/client";
import { mergePlaybookVideos } from "@/lib/playbook/public-videos";
import { isPlaybookVideo } from "@/lib/playbook/content-kind";
import { trackVideoPlay } from "@/lib/analytics";
import { PlaybookVideoCard, PlaybookVideoModalFrame } from "@/components/playbook/PlaybookVideoCard";

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
    contentKind: (row.content_kind as PlaybookVideo["contentKind"]) ?? undefined,
  };
}

interface PlaybookShortVideoGridProps {
  limit?: number;
}

export function PlaybookShortVideoGrid({ limit }: PlaybookShortVideoGridProps) {
  const [videos, setVideos] = useState<PlaybookVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<PlaybookVideo | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("playbook_videos")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return;
        const dbVideos = data.map(rowToVideo).filter((v) => isPlaybookVideo(v) && v.videoUrl?.trim());
        const merged = mergePlaybookVideos(dbVideos);
        setVideos(limit ? merged.slice(0, limit) : merged);
      });
  }, [limit]);

  const openVideo = useCallback((video: PlaybookVideo) => {
    trackVideoPlay(video.title, video.slug, video.category);
    setActiveVideo(video);
  }, []);

  const closeVideo = useCallback(() => setActiveVideo(null), []);

  if (videos.length === 0) return null;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <PlaybookVideoCard
            key={video.id}
            thumbnail={video.thumbnail}
            videoUrl={video.videoUrl}
            title={video.title}
            duration={video.duration}
            onClick={() => openVideo(video)}
          />
        ))}
      </div>

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 px-4 py-8 backdrop-blur-sm"
            onClick={closeVideo}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[min(100%,22rem)]"
            >
              <PlaybookVideoModalFrame
                videoUrl={activeVideo.videoUrl}
                title={activeVideo.title}
                thumbnail={activeVideo.thumbnail}
                onClose={closeVideo}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
