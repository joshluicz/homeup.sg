"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlaybookAutoVideoRail } from "@/components/playbook/PlaybookAutoVideoRail";
import { PlaybookExclusiveWatch, PlaybookVideoModalOverlay } from "@/components/playbook/PlaybookExclusiveWatch";
import type { AgentProfileVideo, AgentVideoCategory } from "@/lib/agents/profile-videos";
import { AGENT_VIDEO_CATEGORIES, rowToAgentProfileVideo, type AgentProfileVideoRow } from "@/lib/agents/profile-videos";
import { getVideoPlatform } from "@/lib/playbook/embed";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AgentProfileVideosProps = {
  agentSlug: string;
  agentFirstName: string;
  initialVideos: AgentProfileVideo[];
};

function toRailItem(video: AgentProfileVideo) {
  return {
    id: video.id,
    title: video.title,
    videoUrl: video.videoUrl,
    thumbnail: video.thumbnail,
  };
}

export function AgentProfileVideos({
  agentSlug,
  agentFirstName,
  initialVideos,
}: AgentProfileVideosProps) {
  const [videos, setVideos] = useState<AgentProfileVideo[]>(initialVideos);
  const [activeVideo, setActiveVideo] = useState<AgentProfileVideo | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | AgentVideoCategory>("all");

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("agent_profile_videos")
      .select("*")
      .eq("agent_slug", agentSlug)
      .eq("featured_in_display_b", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data?.length) return;
        setVideos(data.map((row) => rowToAgentProfileVideo(row as AgentProfileVideoRow)));
      });
  }, [agentSlug]);

  // Only show tabs for categories that actually have at least one video
  const availableCategories = useMemo(
    () => AGENT_VIDEO_CATEGORIES.filter((cat) => videos.some((v) => v.category === cat.value)),
    [videos],
  );

  const filteredVideos = useMemo(
    () => (activeCategory === "all" ? videos : videos.filter((v) => v.category === activeCategory)),
    [videos, activeCategory],
  );

  const railItems = useMemo(() => filteredVideos.map(toRailItem), [filteredVideos]);

  const openVideo = useCallback((video: AgentProfileVideo) => {
    setActiveVideo(video);
  }, []);

  const closeVideo = useCallback(() => setActiveVideo(null), []);

  if (videos.length === 0) return null;

  const activeAspect =
    activeVideo &&
    getVideoPlatform(activeVideo.videoUrl) === "youtube" &&
    !/\/shorts\//i.test(activeVideo.videoUrl)
      ? "landscape"
      : "portrait";

  const showTabs = availableCategories.length > 1;

  return (
    <>
      <section
        aria-label={`${agentFirstName} property videos`}
        className="relative overflow-hidden bg-neutral-950 py-10 sm:py-12"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,154,68,0.25),transparent)]"
        />

        <div className="container-page relative">
          <PlaybookAutoVideoRail
            key={activeCategory}
            inverted
            videos={railItems}
            intro={
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <Eyebrow className="text-primary-300">Property insights</Eyebrow>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Tips from {agentFirstName}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
                  Short-form tips and real-world property advice. Tap a video to watch here — or
                  open it in TikTok / YouTube if you prefer.
                </p>

                {showTabs && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveCategory("all")}
                      className={cn(
                        "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                        activeCategory === "all"
                          ? "border-primary-500 bg-primary-500 text-white shadow-sm"
                          : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-700",
                      )}
                    >
                      All
                      <span
                        className={cn(
                          "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                          activeCategory === "all"
                            ? "bg-white/20 text-white"
                            : "bg-neutral-700 text-neutral-400",
                        )}
                      >
                        {videos.length}
                      </span>
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setActiveCategory(cat.value)}
                        className={cn(
                          "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                          activeCategory === cat.value
                            ? "border-primary-500 bg-primary-500 text-white shadow-sm"
                            : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-700",
                        )}
                      >
                        {cat.label}
                        <span
                          className={cn(
                            "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                            activeCategory === cat.value
                              ? "bg-white/20 text-white"
                              : "bg-neutral-700 text-neutral-400",
                          )}
                        >
                          {videos.filter((v) => v.category === cat.value).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
            onVideoSelect={(item) => {
              const match = videos.find((video) => video.id === item.id);
              if (match) openVideo(match);
            }}
          />
        </div>
      </section>

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PlaybookVideoModalOverlay onClose={closeVideo}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
              >
                <PlaybookExclusiveWatch
                  videoUrl={activeVideo.videoUrl}
                  slug={activeVideo.slug}
                  title={activeVideo.title}
                  thumbnail={activeVideo.thumbnail}
                  autoplay
                  aspect={activeAspect ?? "portrait"}
                  variant="modal"
                  badgeLabel="HomeUP Agent"
                  onClose={closeVideo}
                  closeLabel="Close"
                />
              </motion.div>
            </PlaybookVideoModalOverlay>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
