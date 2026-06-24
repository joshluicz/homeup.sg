"use client";

import Link from "next/link";
import { PlaybookVideoBrowseTile } from "@/components/playbook/PlaybookVideoBrowseTile";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { playbookVideoHref } from "@/lib/playbook/embed";
import { cn } from "@/lib/utils";

type PlaybookVideoRailProps = {
  videos: PlaybookVideo[];
  label?: string;
};

function VideoRailCard({ video }: { video: PlaybookVideo }) {
  const { href } = playbookVideoHref(video);

  return (
    <div className="relative shrink-0 snap-start py-2">
      <Link
        href={href}
        className={cn(
          "group/tile block w-[148px] transition duration-200 sm:w-[160px]",
          "hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        )}
        aria-label={`Watch ${video.title}`}
      >
        <PlaybookVideoBrowseTile
          thumbnail={video.thumbnail}
          videoUrl={video.videoUrl}
          title={video.title}
          variant="rail"
        />
      </Link>
    </div>
  );
}

export function PlaybookVideoRail({ videos, label = "Watch" }: PlaybookVideoRailProps) {
  if (videos.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-neutral-500">
          {label}
        </h3>
        <p className="text-xs font-normal text-neutral-400">Tap a title to watch</p>
      </div>
      <div className="-mx-4 overflow-x-auto overflow-y-visible px-4 pb-4 pt-1 scrollbar-none sm:-mx-0 sm:px-0">
        <div className="flex snap-x snap-mandatory gap-4 sm:gap-5">
          {videos.map((video) => (
            <VideoRailCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </div>
  );
}
