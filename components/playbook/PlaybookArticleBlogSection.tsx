"use client";

import { PlaybookArticleCard } from "@/components/playbook/PlaybookArticleCard";
import { PlaybookFeaturedCarousel } from "@/components/playbook/PlaybookFeaturedCarousel";
import type { PlaybookVideo } from "@/lib/data/playbook";

type PlaybookArticleBlogSectionProps = {
  stageId: string;
  categoryLabel: string;
  description: string;
  articles: PlaybookVideo[];
};

export function PlaybookArticleBlogSection({
  stageId,
  categoryLabel,
  description,
  articles,
}: PlaybookArticleBlogSectionProps) {
  if (articles.length === 0) return null;

  const gridId = `${stageId}-articles`;

  return (
    <div className="mt-12 border-t border-neutral-100 pt-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10">
        <div>
          <h3 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Blogs
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-neutral-500 sm:text-base">
            {description}
          </p>
          <a
            href={`#${gridId}`}
            className="mt-5 inline-flex text-sm font-bold text-primary-600 transition hover:text-primary-700 hover:underline"
          >
            See more guides ↓
          </a>
        </div>

        <PlaybookFeaturedCarousel articles={articles} />
      </div>

      <div id={gridId} className="scroll-mt-36 mt-12">
        <div className="mb-6 flex flex-col gap-1 border-b border-neutral-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600">
              {categoryLabel}
            </p>
            <h4 className="mt-1 font-display text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
              All {categoryLabel} guides
            </h4>
          </div>
          <p className="text-sm text-neutral-400">{articles.length} articles</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <PlaybookArticleCard key={article.id} article={article} variant="mockup" />
          ))}
        </div>
      </div>
    </div>
  );
}
