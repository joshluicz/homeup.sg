"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PLAYBOOK JOURNEY SECTION
//
// BLOCK 1 — Three-stage journey navigator (sticky step bar)
// BLOCK 2 — Three content stage sections (live video embed + article cards)
// BLOCK 3 — Sticky WhatsApp planning-call CTA (desktop right / mobile bottom bar)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toEmbedUrl, resolveThumbnail, isDirectVideoFile } from "@/lib/playbook/embed";
import type { PlaybookVideo, PlaybookTopic } from "@/lib/data/playbook";
import { TOPIC_LABELS } from "@/lib/data/playbook";

// ── WhatsApp URL ──────────────────────────────────────────────────────────────
const WA_URL =
  "https://wa.me/6580877015?text=Hi%2C%20I%20found%20the%20HomeUP%20Playbook%20and%20would%20like%20a%20planning%20call.";

// ── Stage metadata (structural, not content) ──────────────────────────────────
interface StageConfig {
  id: string;
  step: number;
  topic: PlaybookTopic;
  description: string;
}

const STAGES: StageConfig[] = [
  {
    id: "stage-1",
    step: 1,
    topic: "upgraders",
    description:
      "Worried about ABSD, timing both transactions, or whether upgrading actually makes financial sense right now? These guides answer the questions most agents won't.",
  },
  {
    id: "stage-2",
    step: 2,
    topic: "buying_first",
    description:
      "From loan eligibility and down payment maths to negotiation tactics and showroom traps — everything you need before you sign anything.",
  },
  {
    id: "stage-3",
    step: 3,
    topic: "condo_tips",
    description:
      "Market myths, investment strategies that backfire, and how to spot a genuinely undervalued unit. Straight talk from Dennis.",
  },
];

// ── Inline Video Player ───────────────────────────────────────────────────────
function InlineVideo({
  video,
  onClose,
}: {
  video: PlaybookVideo;
  onClose: () => void;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-900" style={{ aspectRatio: "16/9" }}>
      <button
        onClick={onClose}
        aria-label="Close video"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800/80 text-white backdrop-blur-sm transition-colors hover:bg-neutral-700"
      >
        <X className="h-4 w-4" />
      </button>
      {isDirectVideoFile(video.videoUrl) ? (
        <video
          src={video.videoUrl}
          title={video.title}
          controls
          autoPlay
          playsInline
          className="h-full w-full"
        />
      ) : (
        <iframe
          src={`${toEmbedUrl(video.videoUrl)}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      )}
    </div>
  );
}

// ── Video Thumbnail (click to play inline) ───────────────────────────────────
function VideoThumbnail({
  video,
  onPlay,
}: {
  video: PlaybookVideo;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className="group relative w-full overflow-hidden rounded-2xl bg-neutral-100 focus:outline-none"
      style={{ aspectRatio: "16/9" }}
      aria-label={`Play: ${video.title}`}
    >
      {resolveThumbnail(video.thumbnail, video.videoUrl) ? (
        <img
          src={resolveThumbnail(video.thumbnail, video.videoUrl)}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-neutral-200" />
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-neutral-950/30 transition-opacity duration-200 group-hover:bg-neutral-950/20" />
      {/* Play button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-200 group-hover:scale-110">
          <Play className="h-6 w-6 translate-x-0.5 fill-primary-600 text-primary-600" />
        </div>
        {video.duration && (
          <span className="rounded-full bg-neutral-950/60 px-2.5 py-0.5 text-xs font-semibold text-white">
            {video.duration}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Category tag colours ──────────────────────────────────────────────────────
const CATEGORY_TAG: Record<string, { label: string; className: string }> = {
  selling: { label: "Upgrading",   className: "bg-amber-50 text-amber-700 ring-amber-200" },
  buying:  { label: "Buying",      className: "bg-blue-50 text-blue-700 ring-blue-200" },
  market:  { label: "Commentary",  className: "bg-violet-50 text-violet-700 ring-violet-200" },
  process: { label: "Process",     className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  tips:    { label: "Tips",        className: "bg-rose-50 text-rose-700 ring-rose-200" },
};

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ video, isFirst }: { video: PlaybookVideo; isFirst?: boolean }) {
  const wordCount = video.article?.split(/\s+/).length ?? 0;
  const readTime = wordCount > 0
    ? `${Math.max(1, Math.round(wordCount / 200))} min read`
    : "Quick read";

  const teaser = video.description?.trim() || "";
  const tag = CATEGORY_TAG[video.category] ?? CATEGORY_TAG.tips;

  return (
    <Link
      href={`/playbook/${video.slug}`}
      className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-lg"
    >
      {/* Start here badge */}
      {isFirst && (
        <span className="absolute right-4 top-4 rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
          Start here
        </span>
      )}

      {/* Category tag + read time */}
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1", tag.className)}>
          {tag.label}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
          {video.videoUrl
            ? <><Play className="h-2.5 w-2.5 fill-neutral-400" />Watch + {readTime}</>
            : <><Clock className="h-2.5 w-2.5" />{readTime}</>}
        </span>
      </div>

      {/* Title */}
      <p className="font-display text-sm font-bold leading-snug text-neutral-900 group-hover:text-primary-700 sm:text-base">
        {video.title}
      </p>

      {/* Teaser — Dennis's hook */}
      {teaser && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-neutral-500">
          {teaser}
        </p>
      )}

      {/* Read arrow */}
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Read guide
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

// ── Stage Section ─────────────────────────────────────────────────────────────
function StageSection({
  stage,
  articles,
  sectionRef,
}: {
  stage: StageConfig;
  articles: PlaybookVideo[];
  sectionRef: (el: HTMLElement | null) => void;
}) {
  const [playingVideo, setPlayingVideo] = useState<PlaybookVideo | null>(null);

  // Main video for this topic = the MOST POPULAR one (featured); fall back to the latest.
  // Any other videos in the topic surface in the Library grid below, not here.
  const topicVideos = articles.filter((a) => a.videoUrl);
  const primaryVideo = topicVideos.find((a) => a.featured) ?? topicVideos[0] ?? null;
  // Article cards = any item with a readable written guide (and a slug), EXCEPT the one
  // already shown as this topic's main video (it gets a "Read the full guide" link instead).
  // Items that have BOTH a video and an article still appear here so the guide is reachable —
  // their /playbook/[slug] page renders the video AND the article together.
  const articleCards = articles.filter(
    (a) => a.slug && a.article?.trim() && a.id !== primaryVideo?.id,
  );

  return (
    <section
      id={stage.id}
      ref={sectionRef}
      className="scroll-mt-32 border-t border-neutral-100 py-16 sm:py-20"
    >
      <div className="container-page">
        {/* Header */}
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

        {/* Video */}
        {primaryVideo && (
          <div className="mb-10 w-full max-w-3xl">
            {playingVideo ? (
              <InlineVideo video={playingVideo} onClose={() => setPlayingVideo(null)} />
            ) : (
              <VideoThumbnail video={primaryVideo} onPlay={() => setPlayingVideo(primaryVideo)} />
            )}
            {!playingVideo && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-neutral-700">{primaryVideo.title}</p>
                {primaryVideo.description && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-neutral-500">
                    {primaryVideo.description}
                  </p>
                )}
                {primaryVideo.slug && primaryVideo.article?.trim() && (
                  <Link
                    href={`/playbook/${primaryVideo.slug}`}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Read the full guide
                    <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Article card grid */}
        {articleCards.length > 0 && (
          <>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              {articleCards.length} guide{articleCards.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articleCards.map((video, i) => (
                <ArticleCard key={video.id} video={video} isFirst={i === 0} />
              ))}
            </div>
          </>
        )}

        {!primaryVideo && articleCards.length === 0 && (
          <p className="text-sm text-neutral-400">Content coming soon.</p>
        )}
      </div>
    </section>
  );
}

// ── Stage Navigator ───────────────────────────────────────────────────────────
function StageNavigator({
  activeStage,
  articlesByTopic,
}: {
  activeStage: string;
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
                  {articlesByTopic[stage.topic].length > 0 && (
                    <span className={cn(
                      "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-500 group-hover:bg-white/20 group-hover:text-white"
                    )}>
                      {articlesByTopic[stage.topic].length}
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
      .not("topic", "is", null)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const grouped: Record<PlaybookTopic, PlaybookVideo[]> = {
          upgraders: [],
          buying_first: [],
          condo_tips: [],
        };
        for (const row of data) {
          const topic = row.topic as PlaybookTopic;
          if (!grouped[topic]) continue;
          grouped[topic].push({
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
            faq: row.faq ?? [],
            metaDescription: (row.meta_description as string) ?? "",
            topic,
          });
        }
        setArticlesByTopic(grouped);
      });
  }, []);

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
      <StageNavigator activeStage={activeStage} articlesByTopic={articlesByTopic} />

      <div className="bg-white">
        {STAGES.map((stage) => (
          <StageSection
            key={stage.id}
            stage={stage}
            articles={articlesByTopic[stage.topic]}
            sectionRef={setRef(stage.id)}
          />
        ))}
      </div>

      {/* Not sure where to start? */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-14 sm:py-16">
        <div className="container-page flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-primary-600 sm:text-2xl">
              Not sure where to start?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500 sm:text-base">
              Browse all our guides and videos below — organised by topic, at your own pace.
            </p>
          </div>
          <a
            href="#playbook-library"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("playbook-library")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="shrink-0 rounded-xl border-2 border-primary-600 px-6 py-3 text-sm font-bold text-primary-600 transition-all hover:bg-primary-600 hover:text-white"
          >
            Browse All Articles →
          </a>
        </div>
      </section>

      <PlaybookWhatsAppCTA />
    </>
  );
}
