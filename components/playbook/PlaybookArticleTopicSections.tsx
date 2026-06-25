"use client";

import { useMemo } from "react";
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
      {sectionsWithArticles.map(({ section, articles }) => (
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
            {articles.map((article) => (
              <PlaybookArticleCard key={article.id} article={article} variant={variant} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function countFilteredPlaybookArticles(
  articlesByTopic: Record<PlaybookTopic, PlaybookVideo[]>,
  filters: PlaybookJourneyFilters,
): number {
  return flattenPlaybookArticles(articlesByTopic, filters).length;
}
