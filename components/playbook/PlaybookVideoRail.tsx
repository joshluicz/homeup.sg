"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { useState } from "react";
import { PlaybookVideoThumbnail } from "@/components/playbook/PlaybookVideoThumbnail";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { cn } from "@/lib/utils";

type PlaybookVideoRailProps = {
  videos: PlaybookVideo[];
  label?: string;
};

function VideoRailCard({ video }: { video: PlaybookVideo }) {
  const [hovered, setHovered] = useState(false);
  const tags = video.tags ?? [];

  return (
    <div
      className="relative shrink-0 snap-start py-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/playbook/watch/${video.slug}`}
        className={cn(
          "group relative block w-[132px] overflow-hidden rounded-xl bg-neutral-950 shadow-sm transition duration-300 sm:w-[148px]",
          hovered && "z-30 scale-[1.06] shadow-2xl ring-2 ring-white/90",
        )}
        aria-label={`Watch ${video.title}`}
      >
        <div className="relative aspect-[9/16] w-full">
          <PlaybookVideoThumbnail
            thumbnail={video.thumbnail}
            videoUrl={video.videoUrl}
            title={video.title}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />
          {!hovered && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow">
                <Play className="h-4 w-4 translate-x-0.5 fill-primary-600 text-primary-600" />
              </div>
            </div>
          )}
        </div>

        {hovered && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent px-3 pb-3 pt-10 text-white">
            <p className="line-clamp-2 text-xs font-bold leading-snug">{video.title}</p>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white">
              Get Started
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}

export function PlaybookVideoRail({ videos, label = "Watch" }: PlaybookVideoRailProps) {
  if (videos.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="mb-4">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-neutral-500">
          {label}
        </h3>
      </div>
      <div className="-mx-4 overflow-x-auto overflow-y-visible px-4 pb-4 pt-1 scrollbar-none sm:-mx-0 sm:px-0">
        <div className="flex snap-x snap-mandatory gap-3 sm:gap-4">
          {videos.map((video) => (
            <VideoRailCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </div>
  );
}
