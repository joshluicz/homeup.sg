"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PLAYBOOK JOURNEY SECTION
//
// BLOCK 1 — Three-stage journey navigator (sticky step bar)
// BLOCK 2 — Per stage: horizontal videos row, then article cards below
// BLOCK 3 — Sticky WhatsApp planning-call CTA (desktop right / mobile bottom bar)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toEmbedUrl, resolveThumbnail, isDirectVideoFile } from "@/lib/playbook/embed";
import { isPlaybookArticle, isPlaybookVideo } from "@/lib/playbook/content-kind";
import { trackVideoPlay } from "@/lib/analytics";
import { PlaybookVideoCard, PlaybookVideoModalFrame } from "@/components/playbook/PlaybookVideoCard";
import { PlaybookArticleCard } from "@/components/playbook/PlaybookArticleCard";
import type { PlaybookVideo, PlaybookTopic } from "@/lib/data/playbook";
import {
  PLAYBOOK_JOURNEY_SECTIONS,
  PLAYBOOK_TOPICS,
  TOPIC_LABELS,
  inferPlaybookTopicFromCategory,
} from "@/lib/data/playbook";

// ── WhatsApp URL ──────────────────────────────────────────────────────────────
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
    tags: row.tags as string[],
    article: (row.article as string) ?? "",
    faq: ((row.faq as { q: string; a: string }[]) ?? []).filter((f) => f?.q && f?.a),
    metaDescription: (row.meta_description as string) ?? "",
    topic,
    contentKind: (row.content_kind as PlaybookVideo["contentKind"]) ?? undefined,
  };
}

// ── Video card + modal (shared full-frame vertical layout) ────────────────────
function StageVideoCard({
  video,
  onPlay,
}: {
  video: PlaybookVideo;
  onPlay: (video: PlaybookVideo) => void;
}) {
  return (
    <PlaybookVideoCard
      thumbnailSrc={resolveThumbnail(video.thumbnail, video.videoUrl)}
      title={video.title}
      duration={video.duration}
      onClick={() => onPlay(video)}
    />
  );
}

function VideoModal({ video, onClose }: { video: PlaybookVideo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div className="w-full max-w-[min(100%,22rem)]">
        <PlaybookVideoModalFrame title={video.title} onClose={onClose}>
          {isDirectVideoFile(video.videoUrl) ? (
            <video
              src={video.videoUrl}
              title={video.title}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <iframe
              src={toEmbedUrl(video.videoUrl)}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          )}
        </PlaybookVideoModalFrame>
      </div>
    </div>
  );
}

// ── Stage Section ─────────────────────────────────────────────────────────────
function StageSection({
  stage,
  videos,
  articles,
  onPlayVideo,
  sectionRef,
}: {
  stage: (typeof STAGES)[number];
  videos: PlaybookVideo[];
  articles: PlaybookVideo[];
  onPlayVideo: (video: PlaybookVideo) => void;
  sectionRef: (el: HTMLElement | null) => void;
}) {
  const articleCards = articles.filter((a) => a.slug && a.article?.trim());
  const stageVideos = videos.filter((v) => v.videoUrl?.trim());
  const hasContent = stageVideos.length > 0 || articleCards.length > 0;

  return (
    <section
      id={stage.id}
      ref={sectionRef}
      className="scroll-mt-32 border-t border-neutral-100 py-16 sm:py-20"
    >
      <div className="container-page">
        <div className="mb-10 max-w-2xl">
          <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
            {stage.step}
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
            {TOPIC_LABELS[stage.topic]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
            {stage.description}
          </p>
        </div>

        {stageVideos.length > 0 && (
          <div className={cn(articleCards.length > 0 && "mb-10")}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stageVideos.map((video) => (
                <StageVideoCard key={video.id} video={video} onPlay={onPlayVideo} />
              ))}
            </div>
          </div>
        )}

        {articleCards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articleCards.map((video, i) => (
              <PlaybookArticleCard key={video.id} article={video} isFirst={i === 0} />
            ))}
          </div>
        )}

        {!hasContent && (
          <p className="text-sm text-neutral-400">Content coming soon.</p>
        )}
      </div>
    </section>
  );
}

// ── Stage Navigator ───────────────────────────────────────────────────────────
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
      <div className="container-page">
        <nav
          aria-label="Journey stages"
          className="relative flex flex-col gap-0 sm:flex-row"
        >
          {STAGES.map((stage, idx) => {
            const isActive = activeStage === stage.id;
            const isLast = idx === STAGES.length - 1;

            return (
              <button
                key={stage.id}
                onClick={() => scrollTo(stage.id)}
                className={cn(
                  "group relative flex flex-1 items-center gap-3 px-4 py-4 text-left text-sm font-semibold transition-all duration-200",
                  "border-b-2 border-transparent text-neutral-500 hover:bg-primary-600 hover:text-white hover:border-primary-600",
                  isActive && "border-primary-600 text-primary-600",
                  !isLast && "sm:border-r sm:border-r-neutral-100",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200",
                    isActive
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-primary-600",
                  )}
                >
                  {stage.step}
                </span>
                <span className="leading-tight">
                  {TOPIC_LABELS[stage.topic]}
                  {(videosByTopic[stage.topic].length + articlesByTopic[stage.topic].length) > 0 && (
                    <span className={cn(
                      "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-500 group-hover:bg-white/20 group-hover:text-white"
                    )}>
                      {videosByTopic[stage.topic].length + articlesByTopic[stage.topic].length}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ── Sticky WhatsApp CTA ───────────────────────────────────────────────────────
function PlaybookWhatsAppCTA() {
  return (
    <>
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-2xl bg-primary-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 hover:pr-5 lg:flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.859L.057 23.704a.5.5 0 0 0 .612.612l5.845-1.475A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.512-5.214-1.408l-.375-.218-3.88.979.996-3.765-.232-.386A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        Free Planning Call
      </a>
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2.5 bg-primary-600 py-4 text-sm font-bold text-white transition-colors hover:bg-primary-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.859L.057 23.704a.5.5 0 0 0 .612.612l5.845-1.475A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.512-5.214-1.408l-.375-.218-3.88.979.996-3.765-.232-.386A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          Free Planning Call → WhatsApp Us
        </a>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function PlaybookJourney() {
  const [activeStage, setActiveStage] = useState(STAGES[0].id);
  const [activeVideo, setActiveVideo] = useState<PlaybookVideo | null>(null);
  const [videosByTopic, setVideosByTopic] = useState<Record<PlaybookTopic, PlaybookVideo[]>>({
    upgraders: [],
    buying_first: [],
    condo_tips: [],
  });
  const [articlesByTopic, setArticlesByTopic] = useState<Record<PlaybookTopic, PlaybookVideo[]>>({
    upgraders: [],
    buying_first: [],
    condo_tips: [],
  });
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("playbook_videos")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const videos: Record<PlaybookTopic, PlaybookVideo[]> = {
          upgraders: [],
          buying_first: [],
          condo_tips: [],
        };
        const articles: Record<PlaybookTopic, PlaybookVideo[]> = {
          upgraders: [],
          buying_first: [],
          condo_tips: [],
        };
        for (const row of data) {
          const topic = resolveTopic(row);
          const entry = rowToPlaybookVideo(row, topic);
          if (isPlaybookVideo(entry) && entry.videoUrl?.trim()) {
            videos[topic].push(entry);
          } else if (isPlaybookArticle(entry) && entry.article?.trim()) {
            articles[topic].push(entry);
          }
        }
        setVideosByTopic(videos);
        setArticlesByTopic(articles);
      });
  }, []);

  function handlePlayVideo(video: PlaybookVideo) {
    setActiveVideo(video);
    trackVideoPlay(video.title, video.slug, video.category);
  }

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    STAGES.forEach((stage) => {
      const el = sectionRefs.current.get(stage.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveStage(stage.id); },
        { rootMargin: "-40% 0px -55% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

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

      <div className="bg-white">
        {STAGES.map((stage) => (
          <StageSection
            key={stage.id}
            stage={stage}
            videos={videosByTopic[stage.topic]}
            articles={articlesByTopic[stage.topic]}
            onPlayVideo={handlePlayVideo}
            sectionRef={setRef(stage.id)}
          />
        ))}
      </div>

      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}

      <PlaybookWhatsAppCTA />
    </>
  );
}
