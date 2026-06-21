import { Clock } from "lucide-react";
import { PlaybookReturnLink } from "@/components/playbook/PlaybookReturnLink";
import { CATEGORY_LABELS, TOPIC_LABELS } from "@/lib/data/playbook";
import type { PlaybookVideo } from "@/lib/data/playbook";

function formatPublishedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function readTimeMinutes(article: string): number {
  const words = article.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function PlaybookArticleHeader({ video }: { video: PlaybookVideo }) {
  const topicLabel = video.topic ? TOPIC_LABELS[video.topic] : null;
  const readTime = readTimeMinutes(video.article ?? "");

  return (
    <header className="border-b border-neutral-200 pb-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <PlaybookReturnLink>← Playbook</PlaybookReturnLink>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold uppercase tracking-wider text-primary-600">
          {CATEGORY_LABELS[video.category]}
        </span>
        {topicLabel && (
          <>
            <span className="text-neutral-300" aria-hidden>
              ·
            </span>
            <span className="text-sm font-medium text-neutral-500">{topicLabel}</span>
          </>
        )}
      </div>

      <h1 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.15] tracking-tight text-neutral-900">
        {video.title}
      </h1>

      {video.description?.trim() && (
        <p className="mt-4 text-base font-normal leading-relaxed text-neutral-600 sm:text-lg">
          {video.description.trim()}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500">
        <span className="font-semibold text-neutral-800">HomeUP</span>
        <span className="hidden sm:inline text-neutral-300" aria-hidden>
          ·
        </span>
        <time dateTime={video.publishedAt}>{formatPublishedDate(video.publishedAt)}</time>
        <span className="text-neutral-300" aria-hidden>
          ·
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {readTime} min read
        </span>
      </div>
    </header>
  );
}
