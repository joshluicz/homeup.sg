import { PlaybookReturnLink } from "@/components/playbook/PlaybookReturnLink";
import { CATEGORY_LABELS, TOPIC_LABELS } from "@/lib/data/playbook";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { getPlaybookAgentName } from "@/lib/playbook/agent-attribution";

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

export function PlaybookArticleHeader({
  video,
  hideDescription = false,
}: {
  video: PlaybookVideo;
  hideDescription?: boolean;
}) {
  const topicLabel = video.topic ? TOPIC_LABELS[video.topic] : null;
  const readTime = readTimeMinutes(video.article ?? "");
  const published = formatPublishedDate(video.publishedAt);
  const agentName = getPlaybookAgentName(video);

  return (
    <header>
      <nav aria-label="Breadcrumb" className="mb-5">
        <PlaybookReturnLink className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← Playbook
        </PlaybookReturnLink>
      </nav>

      <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
        {CATEGORY_LABELS[video.category]}
        {topicLabel && (
          <>
            <span className="mx-2 text-neutral-300" aria-hidden>
              |
            </span>
            {topicLabel}
          </>
        )}
      </p>

      <h1 className="mt-3 font-display text-[clamp(1.875rem,4.5vw,2.625rem)] font-extrabold leading-[1.12] tracking-tight text-neutral-900">
        {video.title}
      </h1>

      {video.description?.trim() && !hideDescription && (
        <p className="mt-5 text-lg font-medium leading-[1.65] text-neutral-800 sm:text-xl">
          {video.description.trim()}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-neutral-200 pb-6 text-sm text-neutral-600">
        <span className="font-semibold text-neutral-900">{agentName}</span>
        <span className="text-neutral-300" aria-hidden>
          ·
        </span>
        <span>Published {published}</span>
        <span className="text-neutral-300" aria-hidden>
          ·
        </span>
        <span>{readTime} min read</span>
      </div>
    </header>
  );
}
