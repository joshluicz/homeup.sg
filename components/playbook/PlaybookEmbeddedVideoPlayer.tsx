import { ExternalLink } from "lucide-react";
import {
  externalVideoWatchUrl,
  externalWatchLabel,
  getVideoPlatform,
  isDirectVideoFile,
  resolveThumbnail,
  toEmbedUrl,
} from "@/lib/playbook/embed";
import { cn } from "@/lib/utils";

type PlaybookEmbeddedVideoPlayerProps = {
  videoUrl: string;
  title: string;
  thumbnail?: string;
  autoplay?: boolean;
  aspect?: "portrait" | "landscape";
  className?: string;
  playerClassName?: string;
  showExternalLink?: boolean;
  externalLinkClassName?: string;
};

export function supportsExternalWatchLink(videoUrl?: string): boolean {
  const platform = getVideoPlatform(videoUrl);
  return platform === "tiktok" || platform === "youtube" || platform === "vimeo";
}

export function PlaybookExternalWatchButton({
  videoUrl,
  className,
}: {
  videoUrl: string;
  className?: string;
}) {
  if (!supportsExternalWatchLink(videoUrl)) return null;

  return (
    <a
      href={externalVideoWatchUrl(videoUrl)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50",
        className,
      )}
    >
      <ExternalLink className="h-4 w-4 shrink-0 text-neutral-500" />
      {externalWatchLabel(videoUrl)}
    </a>
  );
}

export function PlaybookEmbeddedVideoPlayer({
  videoUrl,
  title,
  thumbnail,
  autoplay = false,
  aspect = "portrait",
  className,
  playerClassName,
  showExternalLink = true,
  externalLinkClassName,
}: PlaybookEmbeddedVideoPlayerProps) {
  const thumb = resolveThumbnail(thumbnail, videoUrl);
  const embedBase = toEmbedUrl(videoUrl);
  const embedSrc =
    autoplay && !isDirectVideoFile(videoUrl)
      ? `${embedBase}${embedBase.includes("?") ? "&" : "?"}autoplay=1`
      : embedBase;

  return (
    <div className={className}>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-neutral-950",
          aspect === "portrait" ? "aspect-[9/16]" : "aspect-video",
          playerClassName,
        )}
      >
        {isDirectVideoFile(videoUrl) ? (
          <video
            src={videoUrl}
            title={title}
            controls
            autoPlay={autoplay}
            playsInline
            poster={thumb || undefined}
            className="h-full w-full object-contain"
          />
        ) : (
          <iframe
            src={embedSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        )}
      </div>

      {showExternalLink && <PlaybookExternalWatchButton videoUrl={videoUrl} className={externalLinkClassName} />}
    </div>
  );
}
