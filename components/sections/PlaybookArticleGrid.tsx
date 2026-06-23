"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlaybookVideo, PlaybookTopic } from "@/lib/data/playbook";
import {
  PLAYBOOK_JOURNEY_SECTIONS,
  PLAYBOOK_TOPICS,
  TOPIC_LABELS,
  inferPlaybookTopicFromCategory,
} from "@/lib/data/playbook";
import { createClient } from "@/lib/supabase/client";
import { isPlaybookArticle } from "@/lib/playbook/content-kind";
import { PlaybookArticleCard } from "@/components/playbook/PlaybookArticleCard";
import { cn } from "@/lib/utils";

function rowToVideo(row: Record<string, unknown>): PlaybookVideo {
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
    topic: (row.topic as PlaybookVideo["topic"]) ?? null,
    contentKind: (row.content_kind as PlaybookVideo["contentKind"]) ?? undefined,
  };
}

function resolveArticleTopic(article: PlaybookVideo): PlaybookTopic {
  if (article.topic && PLAYBOOK_TOPICS.includes(article.topic)) {
    return article.topic;
  }
  return inferPlaybookTopicFromCategory(article.category);
}

type TopicFilter = "all" | PlaybookTopic;

export function PlaybookArticleGrid() {
  const [articles, setArticles] = useState<PlaybookVideo[]>([]);
  const [activeTopic, setActiveTopic] = useState<TopicFilter>("all");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("playbook_videos")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return;
        setArticles(data.map(rowToVideo).filter((v) => isPlaybookArticle(v) && v.article?.trim()));
      });
  }, []);

  const articlesByTopic = useMemo(() => {
    const grouped: Record<PlaybookTopic, PlaybookVideo[]> = {
      upgraders: [],
      buying_first: [],
      condo_tips: [],
    };
    for (const article of articles) {
      grouped[resolveArticleTopic(article)].push(article);
    }
    return grouped;
  }, [articles]);

  const visibleSections =
    activeTopic === "all"
      ? PLAYBOOK_JOURNEY_SECTIONS
      : PLAYBOOK_JOURNEY_SECTIONS.filter((section) => section.topic === activeTopic);

  return (
    <section className="section-padding bg-white">
      <div className="container-page">
        <div className="mb-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTopic("all")}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
              activeTopic === "all"
                ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
            )}
          >
            All sections
          </button>
          {PLAYBOOK_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setActiveTopic(topic)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                activeTopic === topic
                  ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
              )}
            >
              {TOPIC_LABELS[topic]}
              {articlesByTopic[topic].length > 0 && (
                <span className="ml-1.5 opacity-80">{articlesByTopic[topic].length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-16">
          {visibleSections.map((section) => {
            const sectionArticles = articlesByTopic[section.topic];
            if (sectionArticles.length === 0) return null;

            return (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <div className="mb-8 max-w-2xl">
                  <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {section.step}
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
                    {TOPIC_LABELS[section.topic]}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
                    {section.description}
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {sectionArticles.map((article) => (
                    <PlaybookArticleCard key={article.id} article={article} variant="grid" />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {articles.length === 0 && (
          <p className="py-16 text-center text-sm text-neutral-400">No articles published yet.</p>
        )}

        {articles.length > 0 && visibleSections.every((s) => articlesByTopic[s.topic].length === 0) && (
          <p className="py-16 text-center text-sm text-neutral-400">No articles in this section yet.</p>
        )}
      </div>
    </section>
  );
}
