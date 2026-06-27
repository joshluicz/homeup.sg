"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PLAYBOOK JOURNEY — Dennis revamp (Jun)
// Top ~1/3: black hero + Display A auto-scrolling videos (all videos, no categories)
// Bottom ~2/3: white blog hero, featured carousel, filtered article grid
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { isPlaybookArticle } from "@/lib/playbook/content-kind";
import {
  agentProfileVideoToPlaybookVideo,
  groupPlaybookVideosByTopic,
  mergePlaybookVideos,
} from "@/lib/playbook/public-videos";
import { rowToAgentProfileVideo, type AgentProfileVideoRow } from "@/lib/agents/profile-videos";
import {
  DEFAULT_PLAYBOOK_JOURNEY_FILTERS,
  filterDisplayAVideos,
  flattenPlaybookArticles,
  flattenPlaybookVideos,
  hasActivePlaybookFilters,
  type PlaybookJourneyFilters,
} from "@/lib/playbook/playbook-filters";
import { pickRandomFeaturedArticles } from "@/lib/playbook/featured-articles";
import { PlaybookAutoVideoRail } from "@/components/playbook/PlaybookAutoVideoRail";
import { PlaybookExclusiveWatch, PlaybookVideoModalOverlay } from "@/components/playbook/PlaybookExclusiveWatch";
import {
  countFilteredPlaybookArticles,
  PlaybookArticleTopicSections,
} from "@/components/playbook/PlaybookArticleTopicSections";
import { PlaybookFeaturedCarousel } from "@/components/playbook/PlaybookFeaturedCarousel";
import { PlaybookJourneyToolbar } from "@/components/playbook/PlaybookJourneyToolbar";
import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import {
  PLAYBOOK_TOPICS,
  inferPlaybookTopicFromCategory,
} from "@/lib/data/playbook";

const EMPTY_ARTICLES: Record<PlaybookTopic, PlaybookVideo[]> = {
  upgraders: [],
  buying_first: [],
  condo_tips: [],
};

const EMPTY_VIDEOS: Record<PlaybookTopic, PlaybookVideo[]> = {
  upgraders: [],
  buying_first: [],
  condo_tips: [],
};

const WA_URL =
  "https://wa.me/6580877015?text=Hi%2C%20I%20found%20the%20HomeUP%20Playbook%20and%20would%20like%20a%20planning%20call.";

function resolveTopic(row: Record<string, unknown>): PlaybookTopic {
  const topic = row.topic as PlaybookTopic | null;
  if (topic && PLAYBOOK_TOPICS.includes(topic)) return topic;
  return inferPlaybookTopicFromCategory(row.category as PlaybookVideo["category"]);
}

function rowToPlaybookVideo(row: Record<string, unknown>, topic: PlaybookTopic): PlaybookVideo {
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
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    article: (row.article as string) ?? "",
    faq: ((row.faq as { q: string; a: string }[]) ?? []).filter((f) => f?.q && f?.a),
    metaDescription: (row.meta_description as string) ?? "",
    topic,
    contentKind: (row.content_kind as PlaybookVideo["contentKind"]) ?? undefined,
    displayA: row.display_a as boolean | undefined,
    agentSlug: (row.agent_slug as string | null) ?? null,
  };
}

function PlaybookWhatsAppCTA() {
  return (
    <>
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-2xl bg-primary-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 hover:pr-5 lg:flex"
      >
        Free Planning Call
      </a>
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2.5 bg-primary-600 py-4 text-sm font-bold text-white"
        >
          Free Planning Call → WhatsApp Us
        </a>
      </div>
    </>
  );
}

export function PlaybookJourney({
  initialArticlesByTopic = EMPTY_ARTICLES,
  initialVideosByTopic = EMPTY_VIDEOS,
}: {
  initialArticlesByTopic?: Record<PlaybookTopic, PlaybookVideo[]>;
  initialVideosByTopic?: Record<PlaybookTopic, PlaybookVideo[]>;
}) {
  const [filters, setFilters] = useState<PlaybookJourneyFilters>(DEFAULT_PLAYBOOK_JOURNEY_FILTERS);
  const [articlesByTopic, setArticlesByTopic] = useState(initialArticlesByTopic);
  const [videosByTopic, setVideosByTopic] = useState(initialVideosByTopic);
  const [activeVideo, setActiveVideo] = useState<PlaybookVideo | null>(null);

  const allVideos = useMemo(() => flattenPlaybookVideos(videosByTopic), [videosByTopic]);
  const displayAVideos = useMemo(
    () => filterDisplayAVideos(allVideos, filters),
    [allVideos, filters],
  );
  const displayARailItems = useMemo(
    () =>
      displayAVideos.map((video) => ({
        id: video.id,
        slug: video.slug,
        title: video.title,
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        duration: video.duration,
      })),
    [displayAVideos],
  );
  const allArticlesPool = useMemo(
    () => flattenPlaybookArticles(articlesByTopic, DEFAULT_PLAYBOOK_JOURNEY_FILTERS),
    [articlesByTopic],
  );
  const [featuredArticles, setFeaturedArticles] = useState<PlaybookVideo[]>([]);
  const featuredInitialized = useRef(false);

  const articleCount = countFilteredPlaybookArticles(articlesByTopic, filters);
  const filtersActive = hasActivePlaybookFilters(filters);

  useEffect(() => {
    if (featuredInitialized.current || allArticlesPool.length === 0) return;
    featuredInitialized.current = true;
    setFeaturedArticles(pickRandomFeaturedArticles(allArticlesPool, 5));
  }, [allArticlesPool]);

  const topicLabel =
    filters.topic === "all" ? "All topics" : undefined;

  const openVideo = useCallback((video: PlaybookVideo) => setActiveVideo(video), []);
  const closeVideo = useCallback(() => setActiveVideo(null), []);

  useEffect(() => {
    setArticlesByTopic(initialArticlesByTopic);
  }, [initialArticlesByTopic]);

  useEffect(() => {
    setVideosByTopic(initialVideosByTopic);
  }, [initialVideosByTopic]);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("playbook_videos").select("*").order("published_at", { ascending: false }),
      supabase.from("agent_profile_videos").select("*").eq("featured_in_display_a", true),
    ]).then(([playbookRes, agentRes]) => {
      if (playbookRes.error || !playbookRes.data) return;

      // playbook_videos feeds articles only — not Display A
      const articles: Record<PlaybookTopic, PlaybookVideo[]> = {
        upgraders: [],
        buying_first: [],
        condo_tips: [],
      };

      for (const row of playbookRes.data) {
        const topic = resolveTopic(row);
        const entry = rowToPlaybookVideo(row, topic);
        if (isPlaybookArticle(entry) && entry.article?.trim()) {
          articles[topic].push(entry);
        }
      }

      // Display A exclusively uses agent_profile_videos (admin panel is source of truth)
      const agentVideos = (agentRes.error || !agentRes.data ? [] : agentRes.data)
        .map((row) => rowToAgentProfileVideo(row as AgentProfileVideoRow))
        .filter((v) => v.videoUrl?.trim())
        .map(agentProfileVideoToPlaybookVideo);

      setArticlesByTopic(articles);
      setVideosByTopic(groupPlaybookVideosByTopic(mergePlaybookVideos([], agentVideos)));
    });
  }, []);

  return (
    <>
      {/* TOP ~1/3 — black hero + Display A video strip */}
      <section className="relative overflow-hidden bg-neutral-950 pb-10 pt-2 text-white sm:pb-12">
        <div className="container-page relative">
          <PlaybookAutoVideoRail
            inverted
            videos={displayARailItems}
            className="mt-8 sm:mt-10"
            onVideoSelect={(item) => {
              const match = displayAVideos.find(
                (video) => video.id === item.id || video.slug === item.slug,
              );
              if (match) openVideo(match);
            }}
          />

          {displayAVideos.length === 0 && (
            <p className="mt-8 text-center text-sm text-neutral-500">
              {filtersActive
                ? "No videos match these filters yet — try another topic or agent, or browse the articles below."
                : "Exclusive video tips coming soon."}
            </p>
          )}
        </div>
      </section>

      {/* BOTTOM ~2/3 — blogs hero on warm cream, matching article reading pages */}
      <section className="bg-[#faf9f5] pb-20 lg:pb-0">
        <PlaybookJourneyToolbar
          filters={filters}
          onChange={setFilters}
          resultCount={articleCount}
        />

        <div className="container-page py-14 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                Blogs
              </h2>
            </div>

            <PlaybookFeaturedCarousel articles={featuredArticles} curated />
          </div>

          <div className="mt-14 scroll-mt-36">
            {articleCount === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-neutral-700">No articles found</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {filtersActive
                    ? "Try a different topic, agent, or search term."
                    : "Guides coming soon."}
                </p>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_PLAYBOOK_JOURNEY_FILTERS)}
                    className="mt-4 text-sm font-semibold text-primary-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {topicLabel && (
                  <div className="mb-10 border-b border-neutral-200 pb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary-600">
                      Browse by topic
                    </p>
                    <h3 className="mt-1 font-display text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                      {topicLabel}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-400">
                      {articleCount} article{articleCount === 1 ? "" : "s"} across{" "}
                      {filters.topic === "all" ? "three journey stages" : "this stage"}
                    </p>
                  </div>
                )}

                <PlaybookArticleTopicSections
                  articlesByTopic={articlesByTopic}
                  filters={filters}
                  variant="mockup"
                />
              </>
            )}
          </div>
        </div>
      </section>

      <PlaybookWhatsAppCTA />

      <AnimatePresence>
        {activeVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PlaybookVideoModalOverlay onClose={closeVideo}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
              >
                <PlaybookExclusiveWatch
                  videoUrl={activeVideo.videoUrl}
                  title={activeVideo.title}
                  thumbnail={activeVideo.thumbnail}
                  tags={activeVideo.tags}
                  topic={activeVideo.topic}
                  autoplay
                  aspect="portrait"
                  variant="modal"
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
