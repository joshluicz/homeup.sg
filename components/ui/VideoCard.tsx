"use client";

import { useRouter } from "next/navigation";
import { Play, Clock, Tag } from "lucide-react";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { CATEGORY_LABELS } from "@/lib/data/playbook";
import { resolveThumbnail } from "@/lib/playbook/embed";
import { savePlaybookReturn } from "@/lib/playbook/return-to";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: PlaybookVideo;
  onPlay: (video: PlaybookVideo) => void;
  onReadGuide?: (video: PlaybookVideo) => void;
  featured?: boolean;
}

export function VideoCard({ video, onPlay, featured = false }: VideoCardProps) {
  const router = useRouter();
  const hasVideo = Boolean(video.videoUrl?.trim());
  const slug = video.slug?.trim();
  const hasArticle = Boolean(video.article?.trim());
  const articleHref = slug && hasArticle ? `/playbook/${slug}` : undefined;

  function openArticle() {
    if (!articleHref) return;
    savePlaybookReturn();
    router.push(articleHref);
  }

  function handleCardClick() {
    if (articleHref) {
      openArticle();
      return;
    }
    if (hasVideo) onPlay(video);
  }

  const className = cn(
    "group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 touch-manipulation",
    (articleHref || hasVideo) && "cursor-pointer hover:border-primary-600/40 hover:shadow-md",
    featured && "sm:flex-row",
  );

  return (
    <article
      className={className}
      role={articleHref || hasVideo ? "button" : undefined}
      tabIndex={articleHref || hasVideo ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-neutral-100",
          featured ? "aspect-video sm:w-64 lg:w-80" : "aspect-video w-full",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveThumbnail(video.thumbnail, video.videoUrl)}
          alt={video.title}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-500",
            hasVideo && "group-hover:scale-105",
          )}
        />

        <div className="absolute inset-0 bg-neutral-950/30 transition-opacity duration-300 group-hover:bg-neutral-950/20" />

        {hasVideo ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
              <Play className="h-5 w-5 translate-x-0.5 fill-primary-600 text-primary-600" />
            </div>
          </div>
        ) : hasArticle ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-neutral-950/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Read guide
            </span>
          </div>
        ) : null}

        {hasVideo && video.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-neutral-950/70 px-2 py-0.5 backdrop-blur-sm">
            <Clock className="h-3 w-3 text-white/80" />
            <span className="text-xs font-medium text-white">{video.duration}</span>
          </div>
        )}

        {video.featured && (
          <div className="absolute left-2 top-2 rounded-md bg-primary-600 px-2 py-0.5">
            <span className="text-xs font-semibold text-white">Featured</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
            <Tag className="h-3 w-3" />
            {CATEGORY_LABELS[video.category]}
          </span>
        </div>

        <h3 className="font-display text-sm font-bold leading-snug text-neutral-900 transition-colors group-hover:text-primary-700">
          {video.title}
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">
          {video.description}
        </p>

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
              <span className="text-xs font-semibold text-primary-600 group-hover:underline">
                Read guide →
              </span>
            )}
            {hasVideo && articleHref && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(video);
                }}
                className="text-xs font-semibold text-neutral-500 hover:text-primary-600 hover:underline"
              >
                Watch video
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
