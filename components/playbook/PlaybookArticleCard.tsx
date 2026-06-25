"use client";

import { ArrowRight, Clock } from "lucide-react";
import { PlaybookArticleLink } from "@/components/playbook/PlaybookArticleLink";
import { CATEGORY_LABELS } from "@/lib/data/playbook";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { PlaybookArticleThumbnail } from "@/components/playbook/PlaybookArticleThumbnail";
import { resolveArticleThumbnail } from "@/lib/playbook/article-thumbnails";
import { getPlaybookAgentName } from "@/lib/playbook/agent-attribution";
import { cn } from "@/lib/utils";

function formatPublishedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CATEGORY_TAG: Record<string, { label: string; className: string }> = {
  selling: { label: "Selling", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  buying: { label: "Buying", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  market: { label: "Market", className: "bg-violet-50 text-violet-700 ring-violet-200" },
  process: { label: "Process", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  tips: { label: "Tips", className: "bg-rose-50 text-rose-700 ring-rose-200" },
};

type PlaybookArticleCardProps = {
  article: PlaybookVideo;
  isFirst?: boolean;
  variant?: "compact" | "grid" | "mockup";
};

export function PlaybookArticleCard({ article, isFirst, variant = "compact" }: PlaybookArticleCardProps) {
  const wordCount = article.article?.split(/\s+/).length ?? 0;
  const readTime =
    wordCount > 0 ? `${Math.max(1, Math.round(wordCount / 200))} min read` : "Quick read";
  const teaser = article.description?.trim() || "";
  const tag = CATEGORY_TAG[article.category] ?? CATEGORY_TAG.tips;
  const thumbnail = resolveArticleThumbnail(article);
  const agentName = getPlaybookAgentName(article);
  const published = formatPublishedDate(article.publishedAt);

  if (variant === "mockup") {
    return (
      <PlaybookArticleLink
        href={`/playbook/${article.slug}`}
        className="group flex h-full flex-col"
      >
        {thumbnail ? (
          <PlaybookArticleThumbnail
            src={thumbnail}
            className="rounded-xl ring-1 ring-neutral-200/80"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-neutral-100 ring-1 ring-neutral-200/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Article
            </span>
          </div>
        )}
        <h3 className="mt-3 font-display text-sm font-bold leading-snug text-neutral-900 group-hover:text-primary-700 sm:text-base">
          {article.title}
        </h3>
        <p className="mt-2 text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700">{agentName}</span>
          <span className="mx-1.5 text-neutral-300" aria-hidden>
            ·
          </span>
          <span>{published}</span>
        </p>
      </PlaybookArticleLink>
    );
  }

  if (variant === "grid") {
    return (
      <PlaybookArticleLink
        href={`/playbook/${article.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-primary-600/40 hover:shadow-md"
      >
        {thumbnail ? (
          <PlaybookArticleThumbnail
            src={thumbnail}
            imgClassName="transition-transform duration-500 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-neutral-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Article
            </span>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                tag.className,
              )}
            >
              {CATEGORY_LABELS[article.category]}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
              <Clock className="h-2.5 w-2.5" />
              {readTime}
            </span>
          </div>
          <h3 className="font-display text-base font-bold leading-snug text-neutral-900 group-hover:text-primary-700">
            {article.title}
          </h3>
          {teaser && (
            <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">{teaser}</p>
          )}
          <span className="mt-auto pt-2 text-xs font-semibold text-primary-600 group-hover:underline">
            Read article →
          </span>
        </div>
      </PlaybookArticleLink>
    );
  }

  return (
    <PlaybookArticleLink
      href={`/playbook/${article.slug}`}
      className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-lg"
    >
      {isFirst && (
        <span className="absolute right-4 top-4 rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-600 ring-1 ring-primary-200">
          Start here
        </span>
      )}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
            tag.className,
          )}
        >
          {tag.label}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
          <Clock className="h-2.5 w-2.5" />
          {readTime}
        </span>
      </div>
      <p className="font-display text-sm font-bold leading-snug text-neutral-900 group-hover:text-primary-700 sm:text-base">
        {article.title}
      </p>
      {teaser && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-neutral-500">{teaser}</p>
      )}
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
        Read guide
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </PlaybookArticleLink>
  );
}
