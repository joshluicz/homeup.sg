"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PLAYBOOK JOURNEY SECTION
// Inserted between PlaybookHero (stats block) and PlaybookLibrary / CtaBanner.
//
// BLOCK 1 — Three-stage journey navigator (sticky step bar)
// BLOCK 2 — Three content stage sections (video placeholder + article cards)
// BLOCK 3 — Sticky WhatsApp planning-call CTA (desktop right / mobile bottom bar)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// ── WhatsApp URL ──────────────────────────────────────────────────────────────
const WA_URL =
  "https://wa.me/6580877015?text=Hi%2C%20I%20found%20the%20HomeUP%20Playbook%20and%20would%20like%20a%20planning%20call.";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ArticleCard {
  title: string;
  readTime: string;
  href?: string;
  isLive?: boolean;
}

interface Stage {
  id: string;
  step: number;
  question: string;
  description: string;
  videoLabel: string;
  cards: ArticleCard[];
}

// ── Stage data ────────────────────────────────────────────────────────────────
const STAGES: Stage[] = [
  {
    id: "stage-1",
    step: 1,
    question: "Upgraders",
    description:
      "For homeowners weighing up whether upgrading makes financial and lifestyle sense right now.",
    videoLabel: "Upgraders",
    cards: [
      {
        title: "HDB vs Condo: The Real Numbers Behind the Upgrade Decision",
        readTime: "6 min read",
      },
      {
        title: "Should HDB Owners Upgrade in 2026? What the Numbers Say",
        readTime: "5 min read",
      },
      {
        title: "How Much Will You Net From Selling Your HDB?",
        readTime: "7 min read",
      },
    ],
  },
  {
    id: "stage-2",
    step: 2,
    question: "Buying Your 1st Property",
    description:
      "For homeowners who've decided to upgrade and want to understand the process, costs, and timing.",
    videoLabel: "Buying Your 1st Property",
    cards: [
      {
        title: "HDB MOP: What Happens When Your 5 Years Are Up",
        readTime: "5 min read",
      },
      {
        title: "ABSD Singapore 2026: What It Costs and 5 Legal Ways to Reduce It",
        readTime: "8 min read",
      },
      {
        title: "Property Decoupling Explained: Costs, Risks, and When It Makes Sense",
        readTime: "6 min read",
      },
      {
        title: "Bridging Loans in Singapore: When You Need One (And When You Don't)",
        readTime: "5 min read",
      },
      {
        title: "Property Agent Commission: Fixed Fee vs 2% — What You Actually Pay",
        readTime: "4 min read",
      },
      {
        title: "Using CPF to Buy a Condo: Rules, Limits, and Common Mistakes",
        readTime: "6 min read",
      },
    ],
  },
  {
    id: "stage-3",
    step: 3,
    question: "Condo Tips",
    description:
      "For homeowners ready to list and buy — here's what happens step by step.",
    videoLabel: "Condo Tips",
    cards: [
      {
        title:
          "HDB to Condo: The Exact Step-by-Step Upgrade Process in Singapore (2026)",
        readTime: "10 min read",
      },
      {
        title: "What to Expect on Your First Planning Call with a Property Agent",
        readTime: "4 min read",
      },
      {
        title: "HDB Resale Checklist: Everything to Prepare Before You List",
        readTime: "5 min read",
      },
    ],
  },
];

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ card }: { card: ArticleCard }) {
  const isLive = !!card.isLive;
  const href = card.href ?? "#";

  return (
    <a
      href={href}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200",
        isLive
          ? "hover:border-primary-200 hover:shadow-md"
          : "cursor-default opacity-60",
      )}
      onClick={isLive ? undefined : (e) => e.preventDefault()}
      aria-disabled={!isLive}
    >
      {/* Coming Soon badge */}
      {!isLive && (
        <span className="absolute right-4 top-4 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          Coming Soon
        </span>
      )}

      {/* Read time */}
      <div className="mb-3 flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-primary-600" />
        <span className="text-[11px] font-semibold text-primary-600">
          {card.readTime}
        </span>
      </div>

      {/* Title */}
      <p className="font-display text-sm font-bold leading-snug text-neutral-900 sm:text-base">
        {card.title}
      </p>

      {/* Description */}
      <p className="mt-2 text-xs leading-relaxed text-neutral-400">
        Coming soon — check back shortly.
      </p>
    </a>
  );
}

// ── Video Placeholder ─────────────────────────────────────────────────────────
function VideoPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-100" style={{ aspectRatio: "16/9" }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200">
          <Play className="h-6 w-6 translate-x-0.5 text-neutral-400" />
        </div>
        <p className="text-xs font-medium text-neutral-400">
          Video: {label}
        </p>
      </div>
    </div>
  );
}

// ── Stage Section ─────────────────────────────────────────────────────────────
function StageSection({
  stage,
  sectionRef,
}: {
  stage: Stage;
  sectionRef: (el: HTMLElement | null) => void;
}) {
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
            {stage.question}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
            {stage.description}
          </p>
        </div>

        {/* Video placeholder */}
        <div className="mb-10 w-full max-w-3xl">
          <VideoPlaceholder label={stage.videoLabel} />
        </div>

        {/* Article card grid */}
        <div
          className={cn(
            "grid gap-4",
            stage.cards.length === 6
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {stage.cards.map((card) => (
            <ArticleCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stage Navigator ───────────────────────────────────────────────────────────
function StageNavigator({ activeStage }: { activeStage: string }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    /* ── BLOCK 1: Three-stage journey navigator ── */
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
                  !isLast && "sm:border-r sm:border-r-neutral-100",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {/* Step number bubble */}
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-primary-600"
                >
                  {stage.step}
                </span>
                <span className="leading-tight">{stage.question}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ── Sticky WhatsApp CTA (BLOCK 3) ─────────────────────────────────────────────
function PlaybookWhatsAppCTA() {
  return (
    <>
      {/* Desktop: vertically centred, fixed right */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-2xl bg-primary-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 hover:pr-5 lg:flex"
        style={{ writingMode: "horizontal-tb" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.532 5.859L.057 23.704a.5.5 0 0 0 .612.612l5.845-1.475A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.512-5.214-1.408l-.375-.218-3.88.979.996-3.765-.232-.386A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        Free Planning Call
      </a>

      {/* Mobile: fixed full-width bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2.5 bg-primary-600 py-4 text-sm font-bold text-white transition-colors hover:bg-primary-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 shrink-0"
          >
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
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Track which section is in view using IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

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

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const setRef = (id: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  };

  return (
    <>
      {/* ── BLOCK 1: Stage navigator ── */}
      <StageNavigator activeStage={activeStage} />

      {/* ── BLOCK 2: Stage sections ── */}
      <div className="bg-white">
        {STAGES.map((stage) => (
          <StageSection
            key={stage.id}
            stage={stage}
            sectionRef={setRef(stage.id)}
          />
        ))}
      </div>

      {/* ── BLOCK 4: Not Sure? Browse Articles ── */}
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

    </>
  );
}
