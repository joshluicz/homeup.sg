"use client";

import { useEffect, useState } from "react";
import { BookOpen, Video, RefreshCcw } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TOPIC_LABELS } from "@/lib/data/playbook";
import { createClient } from "@/lib/supabase/client";

export function PlaybookHero() {
  // Live count of real published videos — updates automatically as videos are added.
  const [videoCount, setVideoCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("playbook_videos")
      .select("id", { count: "exact", head: true })
      .not("video_url", "is", null)
      .neq("video_url", "")
      .then(({ count }) => setVideoCount(count ?? 0));
  }, []);

  const stats = [
    { icon: Video, value: videoCount === null ? "—" : `${videoCount}`, label: "Video Guides" },
    { icon: BookOpen, value: `${Object.keys(TOPIC_LABELS).length}`, label: "Topics Covered" },
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
            A curated library of video guides covering every stage of buying and
            selling in Singapore.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4">
          {stats.map(({ icon: Icon, value, label }) => (
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
