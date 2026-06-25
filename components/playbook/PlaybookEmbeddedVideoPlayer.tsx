import { ExternalLink } from "lucide-react";
import {
  externalVideoWatchUrl,
  externalWatchLabel,
  getVideoPlatform,
  isDirectVideoFile,
  resolveThumbnail,
  toEmbedUrl,
} from "@/lib/playbook/embed";
import { PlaybookVideoTitle } from "@/components/playbook/PlaybookVideoTitle";
import { PlaybookTikTokWatchPanel, MODAL_PLAYER_CLASS } from "@/components/playbook/PlaybookTikTokWatchPanel";
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
  /** Render the title centered above the video player. */
  titlePosition?: "none" | "above";
  /** Size player to fit modal viewport height (prevents top/bottom clipping). */
  fitViewport?: boolean;
};

export function supportsExternalWatchLink(videoUrl?: string): boolean {
  if (!videoUrl?.trim()) return false;
  if (/^https?:\/\//i.test(videoUrl.trim())) return true;
  return getVideoPlatform(videoUrl) !== "unknown";
}

export function PlaybookExternalWatchButton({
  videoUrl,
  className,
  variant = "default",
}: {
  videoUrl: string;
  className?: string;
  variant?: "default" | "primary";
}) {
  if (!videoUrl?.trim()) return null;

  const watchUrl = externalVideoWatchUrl(videoUrl);
  const platform = getVideoPlatform(videoUrl);
  const ariaLabel =
    platform === "tiktok"
      ? "Watch now on TikTok"
      : platform === "youtube"
        ? "Watch now on YouTube"
        : "Watch now";

  return (
    <a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition",
        variant === "primary"
          ? "bg-primary-600 text-white shadow-lg shadow-primary-900/30 hover:bg-primary-500"
          : "border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50",
        className,
      )}
    >
      <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />
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
  titlePosition = "none",
  fitViewport = false,
}: PlaybookEmbeddedVideoPlayerProps) {
  const thumb = resolveThumbnail(thumbnail, videoUrl);
  const platform = getVideoPlatform(videoUrl);
  const isTikTok = platform === "tiktok";

  const portraitViewportClass = MODAL_PLAYER_CLASS;
  const landscapeViewportClass =
    "relative mx-auto h-[min(calc(100dvh-11rem),360px)] w-full max-w-lg shrink-0 overflow-hidden bg-neutral-950";

  if (isTikTok) {
    return (
      <div className={cn("flex flex-col", className)}>
        {titlePosition === "above" && (
          <PlaybookVideoTitle title={title} className="mb-4 px-2" size="lg" as="h1" />
        )}
        <PlaybookTikTokWatchPanel
          videoUrl={videoUrl}
          title={title}
          thumbnail={thumbnail}
          autoplay={autoplay}
          fitViewport={fitViewport}
          className={cn(playerClassName)}
        />
        {showExternalLink && (
          <PlaybookExternalWatchButton
            videoUrl={videoUrl}
            variant="primary"
            className={cn("mt-4", externalLinkClassName)}
          />
        )}
      </div>
    );
  }

  const embedSrc = (() => {
    const embedBase = toEmbedUrl(videoUrl);
    return autoplay && !isDirectVideoFile(videoUrl)
      ? `${embedBase}${embedBase.includes("?") ? "&" : "?"}autoplay=1`
      : embedBase;
  })();

  return (
    <div className={cn("flex flex-col", className)}>
      {titlePosition === "above" && (
        <PlaybookVideoTitle title={title} className="mb-4 px-2" size="lg" as="h1" />
      )}

      <div
        className={cn(
          "relative overflow-hidden bg-neutral-950",
          fitViewport
            ? aspect === "portrait"
              ? portraitViewportClass
              : landscapeViewportClass
            : cn("w-full", aspect === "portrait" ? "aspect-[9/16]" : "aspect-video"),
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

      {showExternalLink && (
        <PlaybookExternalWatchButton
          videoUrl={videoUrl}
          variant="primary"
          className={cn("mt-4", externalLinkClassName)}
        />
      )}
    </div>
  );
}
