import { ExternalLink, Play } from "lucide-react";
import { PlaybookVideoThumbnail } from "@/components/playbook/PlaybookVideoThumbnail";
import {
  externalVideoWatchUrl,
  externalWatchLabel,
  getVideoPlatform,
  tiktokHandle,
  tiktokProfileUrlFromVideo,
} from "@/lib/playbook/embed";

type PlaybookExternalVideoPanelProps = {
  title: string;
  videoUrl: string;
  thumbnail?: string;
};

/** Poster + direct link to the exact TikTok / YouTube clip (avoids broken embed “Watch now”). */
export function PlaybookExternalVideoPanel({
  title,
  videoUrl,
  thumbnail,
}: PlaybookExternalVideoPanelProps) {
  const watchUrl = externalVideoWatchUrl(videoUrl);
  const platform = getVideoPlatform(videoUrl);
  const profileUrl = platform === "tiktok" ? tiktokProfileUrlFromVideo(videoUrl) : null;
  const handle = platform === "tiktok" ? tiktokHandle(videoUrl) : null;
  const watchLabel = externalWatchLabel(videoUrl);

  return (
    <div className="overflow-hidden rounded-2xl bg-neutral-950 shadow-xl ring-1 ring-neutral-200">
      <div className="relative aspect-[9/16] w-full">
        <PlaybookVideoThumbnail
          thumbnail={thumbnail}
          videoUrl={videoUrl}
          title={title}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/35 to-neutral-950/10" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-5">
          <p className="mb-4 line-clamp-4 text-center text-sm font-bold leading-snug text-white drop-shadow-sm">
            {title}
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-primary-700"
          >
            <Play className="h-4 w-4 fill-current" />
            {watchLabel}
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>
          {profileUrl && handle && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              View @{handle} on TikTok
              <ExternalLink className="h-3 w-3 opacity-80" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

type PlaybookInlineWatchLinkProps = {
  videoUrl: string;
  className?: string;
};

export function PlaybookInlineWatchLink({ videoUrl, className }: PlaybookInlineWatchLinkProps) {
  const watchUrl = externalVideoWatchUrl(videoUrl);
  const label = externalWatchLabel(videoUrl);

  return (
    <a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label} →
    </a>
  );
}
