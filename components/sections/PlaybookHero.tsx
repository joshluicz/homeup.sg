"use client";

import { useEffect, useState } from "react";
import { BookOpen, Video, RefreshCcw } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { PlaybookTopic } from "@/lib/data/playbook";
import { createClient } from "@/lib/supabase/client";
import { isPlaybookArticle, isPlaybookVideo } from "@/lib/playbook/content-kind";

type HeroStats = {
  articleCount: number;
  videoCount: number;
  topicCount: number;
};

export function PlaybookHero() {
  const [stats, setStats] = useState<HeroStats | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("playbook_videos")
      .select("video_url, article, topic")
      .then(({ data }) => {
        if (!data) return;

        let articleCount = 0;
        let videoCount = 0;
        const topics = new Set<PlaybookTopic>();

        for (const row of data) {
          const entry = {
            article: row.article as string,
            videoUrl: row.video_url as string,
          };
          if (isPlaybookArticle(entry) && row.article?.trim()) articleCount++;
          if (isPlaybookVideo(entry) && row.video_url?.trim()) videoCount++;
          if (row.topic && isPlaybookArticle(entry)) {
            topics.add(row.topic as PlaybookTopic);
          }
        }

        setStats({ articleCount, videoCount, topicCount: topics.size });
      });
  }, []);

  const statsBar = [
    {
      icon: BookOpen,
      value: stats === null ? "—" : `${stats.articleCount}`,
      label: "Articles",
    },
    {
      icon: Video,
      value: stats === null ? "—" : `${stats.videoCount}`,
      label: "Videos",
    },
    { icon: RefreshCcw, value: "Monthly", label: "New Content" },
  ];

  return (
    <section className="relative overflow-hidden bg-neutral-50 pb-16 pt-16 sm:pb-20 sm:pt-20">
      {/* Subtle green gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,154,68,0.08),transparent)]"
      />

      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Playbook</Eyebrow>

          <h1 className="mt-4 font-display text-display-sm font-extrabold tracking-tight text-neutral-900 sm:text-display-md">
            Your Property Journey,{" "}
            <span className="text-primary-600">Explained.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
            A curated library of guides covering every stage of buying and
            selling in Singapore.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4">
          {statsBar.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                <Icon className="h-4 w-4 text-primary-600" />
              </div>
              <p className="font-display text-xl font-bold text-neutral-900">{value}</p>
              <p className="text-xs font-medium text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
