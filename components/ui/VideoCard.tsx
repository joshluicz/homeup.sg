"use client";

import Link from "next/link";
import { Play, Clock, Tag } from "lucide-react";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { CATEGORY_LABELS } from "@/lib/data/playbook";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: PlaybookVideo;
  onPlay: (video: PlaybookVideo) => void;
  featured?: boolean;
}

export function VideoCard({ video, onPlay, featured = false }: VideoCardProps) {
  const hasVideo = Boolean(video.videoUrl);
  const hasArticle = Boolean(video.article?.trim());

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300",
        hasVideo
          ? "cursor-pointer hover:border-primary-600/40 hover:shadow-md"
          : "cursor-default",
        featured && "sm:flex-row"
      )}
      onClick={() => hasVideo && onPlay(video)}
      role={hasVideo ? "button" : undefined}
      tabIndex={hasVideo ? 0 : undefined}
      onKeyDown={(e) => {
        if (hasVideo && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPlay(video);
        }
      }}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-neutral-100",
          featured ? "aspect-video sm:w-64 lg:w-80" : "aspect-video w-full"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-500",
            hasVideo && "group-hover:scale-105"
          )}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-neutral-950/30 transition-opacity duration-300 group-hover:bg-neutral-950/20" />

        {/* Play button */}
        {hasVideo ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
              <Play className="h-5 w-5 translate-x-0.5 fill-primary-600 text-primary-600" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-neutral-950/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Coming Soon
            </span>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-neutral-950/70 px-2 py-0.5 backdrop-blur-sm">
          <Clock className="h-3 w-3 text-white/80" />
          <span className="text-xs font-medium text-white">{video.duration}</span>
        </div>

        {/* Featured badge */}
        {video.featured && (
          <div className="absolute left-2 top-2 rounded-md bg-primary-600 px-2 py-0.5">
            <span className="text-xs font-semibold text-white">Featured</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* Category */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
            <Tag className="h-3 w-3" />
            {CATEGORY_LABELS[video.category]}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-sm font-bold leading-snug text-neutral-900 transition-colors group-hover:text-primary-700">
          {video.title}
        </h3>

        {/* Description */}
        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">
          {video.description}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex flex-wrap gap-1.5">
            {video.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {hasArticle && (
              <Link
                href={`/playbook/${video.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-neutral-500 hover:text-primary-600 hover:underline"
              >
                Read the guide →
              </Link>
            )}
            {hasVideo && (
              <span className="text-xs font-semibold text-primary-600 group-hover:underline">
                Watch →
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
