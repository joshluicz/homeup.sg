"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PLAYBOOK JOURNEY — Dennis revamp layout
// 3 tabs (Sell/Upgrade · Buy Tips · Commentary)
// Per section: videos rail → featured carousel + article grid (mockup layout)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isPlaybookArticle } from "@/lib/playbook/content-kind";
import { PlaybookArticleBlogSection } from "@/components/playbook/PlaybookArticleBlogSection";
import { PlaybookVideoRail } from "@/components/playbook/PlaybookVideoRail";
import { PLAYBOOK_SHEET_VIDEOS } from "@/lib/data/playbook-sheet-videos";
import type { PlaybookTopic, PlaybookVideo } from "@/lib/data/playbook";
import {
  PLAYBOOK_JOURNEY_SECTIONS,
  PLAYBOOK_TOPICS,
  TOPIC_LABELS,
  inferPlaybookTopicFromCategory,
} from "@/lib/data/playbook";

const EMPTY_ARTICLES: Record<PlaybookTopic, PlaybookVideo[]> = {
  upgraders: [],
  buying_first: [],
  condo_tips: [],
};

const WA_URL =
  "https://wa.me/6580877015?text=Hi%2C%20I%20found%20the%20HomeUP%20Playbook%20and%20would%20like%20a%20planning%20call.";

const STAGES = PLAYBOOK_JOURNEY_SECTIONS;

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
  };
}

function StageSection({
  stage,
  videos,
  articles,
  sectionRef,
}: {
  stage: (typeof STAGES)[number];
  videos: PlaybookVideo[];
  articles: PlaybookVideo[];
  sectionRef: (el: HTMLElement | null) => void;
}) {
  const articleCards = articles.filter((a) => a.slug && a.article?.trim());
  const stageVideos = videos.filter((v) => v.videoUrl?.trim());
  const hasContent = stageVideos.length > 0 || articleCards.length > 0;

  return (
    <section
      id={stage.id}
      ref={sectionRef}
      className="scroll-mt-28 border-t border-neutral-100"
    >
      <div className="border-b border-neutral-100 bg-neutral-50/80 py-5">
        <div className="container-page">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600">
            Category
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
            {TOPIC_LABELS[stage.topic]}
          </h2>
        </div>
      </div>

      <div className="container-page py-14 sm:py-16">
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
          {stage.description}
        </p>

        <PlaybookVideoRail videos={stageVideos} label="Watch" />

        <PlaybookArticleBlogSection
          stageId={stage.id}
          categoryLabel={TOPIC_LABELS[stage.topic]}
          description={stage.description}
          articles={articleCards}
        />

        {!hasContent && (
          <p className="text-sm text-neutral-400">Content coming soon.</p>
        )}
      </div>
    </section>
  );
}

function StageNavigator({
  activeStage,
  videosByTopic,
  articlesByTopic,
}: {
  activeStage: string;
  videosByTopic: Record<PlaybookTopic, PlaybookVideo[]>;
  articlesByTopic: Record<PlaybookTopic, PlaybookVideo[]>;
}) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="container-page py-3">
        <nav
          aria-label="Playbook categories"
          className="flex flex-wrap items-center gap-2 sm:gap-3"
        >
          {STAGES.map((stage) => {
            const isActive = activeStage === stage.id;
            const count =
              videosByTopic[stage.topic].length + articlesByTopic[stage.topic].length;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => scrollTo(stage.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 sm:px-5 sm:text-sm",
                  isActive
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-primary-600 hover:bg-primary-50",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {TOPIC_LABELS[stage.topic]}
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                      isActive ? "bg-white/20 text-white" : "bg-primary-100 text-primary-700",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
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
}: {
  initialArticlesByTopic?: Record<PlaybookTopic, PlaybookVideo[]>;
}) {
  const [activeStage, setActiveStage] = useState(STAGES[0].id);
  const [articlesByTopic, setArticlesByTopic] = useState(initialArticlesByTopic);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const videosByTopic = useMemo(() => {
    const grouped: Record<PlaybookTopic, PlaybookVideo[]> = {
      upgraders: [],
      buying_first: [],
      condo_tips: [],
    };
    for (const video of PLAYBOOK_SHEET_VIDEOS) {
      if (video.topic) grouped[video.topic].push(video);
    }
    return grouped;
  }, []);

  useEffect(() => {
    setArticlesByTopic(initialArticlesByTopic);
  }, [initialArticlesByTopic]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("playbook_videos")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return;
        const articles: Record<PlaybookTopic, PlaybookVideo[]> = {
          upgraders: [],
          buying_first: [],
          condo_tips: [],
        };
        for (const row of data) {
          const topic = resolveTopic(row);
          const entry = rowToPlaybookVideo(row, topic);
          if (isPlaybookArticle(entry) && entry.article?.trim()) {
            articles[topic].push(entry);
          }
        }
        setArticlesByTopic(articles);
      });
  }, []);

  useEffect(() => {
    let observers: IntersectionObserver[] = [];

    const disconnectAll = () => {
      observers.forEach((obs) => obs.disconnect());
      observers = [];
    };

    const observeSections = () => {
      disconnectAll();
      STAGES.forEach((stage) => {
        const el = sectionRefs.current.get(stage.id);
        if (!el) return;
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) setActiveStage(stage.id);
          },
          { rootMargin: "-40% 0px -55% 0px" },
        );
        obs.observe(el);
        observers.push(obs);
      });
    };

    observeSections();
    const retry = window.setTimeout(observeSections, 100);

    return () => {
      window.clearTimeout(retry);
      disconnectAll();
    };
  }, [articlesByTopic]);

  const setRef = (id: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  };

  return (
    <>
      <StageNavigator
        activeStage={activeStage}
        videosByTopic={videosByTopic}
        articlesByTopic={articlesByTopic}
      />

      <div className="bg-white pb-20 lg:pb-0">
        {STAGES.map((stage) => (
          <StageSection
            key={stage.id}
            stage={stage}
            videos={videosByTopic[stage.topic]}
            articles={articlesByTopic[stage.topic]}
            sectionRef={setRef(stage.id)}
          />
        ))}
      </div>

      <PlaybookWhatsAppCTA />
    </>
  );
}
