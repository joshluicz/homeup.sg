"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { savePlaybookReturn } from "@/lib/playbook/return-to";
import { PlaybookArticleCard } from "@/components/playbook/PlaybookArticleCard";
import {
  PLAYBOOK_JOURNEY_SECTIONS,
  TOPIC_LABELS,
  type PlaybookTopic,
  type PlaybookVideo,
} from "@/lib/data/playbook";
import {
  filterPlaybookByTopic,
  flattenPlaybookArticles,
  type PlaybookJourneyFilters,
} from "@/lib/playbook/playbook-filters";
import { cn } from "@/lib/utils";

const INITIAL_ARTICLE_LIMIT = 6;

type PlaybookArticleTopicSectionsProps = {
  articlesByTopic: Record<PlaybookTopic, PlaybookVideo[]>;
  filters: PlaybookJourneyFilters;
  variant?: "mockup" | "grid";
  className?: string;
};

function sectionArticles(
  grouped: Record<PlaybookTopic, PlaybookVideo[]>,
  topic: PlaybookTopic,
): PlaybookVideo[] {
  return grouped[topic].filter((item) => item.slug && item.article?.trim());
}

export function PlaybookArticleTopicSections({
  articlesByTopic,
  filters,
  variant = "mockup",
  className,
}: PlaybookArticleTopicSectionsProps) {
  const router = useRouter();

  const navigateToTopic = useCallback(
    (topic: PlaybookTopic) => {
      savePlaybookReturn();
      router.push(`/playbook/topic/${topic}`);
    },
    [router],
  );

  const filteredByTopic = useMemo(
    () => filterPlaybookByTopic(articlesByTopic, filters),
    [articlesByTopic, filters],
  );

  const visibleSections =
    filters.topic === "all"
      ? PLAYBOOK_JOURNEY_SECTIONS
      : PLAYBOOK_JOURNEY_SECTIONS.filter((section) => section.topic === filters.topic);

  const sectionsWithArticles = visibleSections
    .map((section) => ({
      section,
      articles: sectionArticles(filteredByTopic, section.topic),
    }))
    .filter(({ articles }) => articles.length > 0);

  const totalCount = flattenPlaybookArticles(articlesByTopic, filters).length;

  if (totalCount === 0) return null;

  return (
    <div className={cn("space-y-16", className)}>
      {sectionsWithArticles.map(({ section, articles }) => {
        const hasMore = articles.length > INITIAL_ARTICLE_LIMIT;
        const visibleArticles = articles.slice(0, INITIAL_ARTICLE_LIMIT);

        return (
          <section key={section.id} id={section.id} className="scroll-mt-36">
            <div className="mb-8 max-w-2xl">
              <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {section.step}
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-600">
                Stage {section.step}
              </p>
              <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
                {TOPIC_LABELS[section.topic]}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
                {section.description}
              </p>
              <p className="mt-3 text-sm text-neutral-400">
                {articles.length} article{articles.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleArticles.map((article) => (
                <PlaybookArticleCard key={article.id} article={article} variant={variant} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigateToTopic(section.topic)}
                  className="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-primary-400 hover:text-primary-700"
                >
                  View All {articles.length} Articles
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function countFilteredPlaybookArticles(
  articlesByTopic: Record<PlaybookTopic, PlaybookVideo[]>,
  filters: PlaybookJourneyFilters,
): number {
  return flattenPlaybookArticles(articlesByTopic, filters).length;
}
