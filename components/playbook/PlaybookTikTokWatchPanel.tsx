"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { PlaybookVideoThumbnail } from "@/components/playbook/PlaybookVideoThumbnail";
import { externalVideoWatchUrl, toTikTokPlayerEmbedUrl } from "@/lib/playbook/embed";
import { cn } from "@/lib/utils";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);
  return isMobile;
}

type PlaybookTikTokWatchPanelProps = {
  videoUrl: string;
  title: string;
  thumbnail?: string;
  autoplay?: boolean;
  fitViewport?: boolean;
  className?: string;
};

const MODAL_PLAYER_CLASS =
  "relative mx-auto aspect-[9/16] h-[min(calc(100dvh-11rem),480px)] w-auto max-w-full shrink-0 overflow-hidden bg-neutral-950";

/** TikTok preview player - external "Watch now" lives in the parent shell. */
export function PlaybookTikTokWatchPanel({
  videoUrl,
  title,
  thumbnail,
  autoplay = false,
  fitViewport = false,
  className,
}: PlaybookTikTokWatchPanelProps) {
  const [playing, setPlaying] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setPlaying(false);
    setIframeReady(false);
  }, [videoUrl]);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => setPlaying(true), 80);
    return () => window.clearTimeout(timer);
  }, [autoplay, videoUrl]);

  const containerClass = cn(
    fitViewport ? MODAL_PLAYER_CLASS : "relative w-full shrink-0 overflow-hidden bg-neutral-950",
    !fitViewport && "aspect-[9/16]",
    className,
  );

  // TikTok player/v1 iframe renders blank on mobile browsers - open TikTok directly instead.
  if (isMobile) {
    const watchUrl = externalVideoWatchUrl(videoUrl);
    return (
      <div className={containerClass}>
        <div className="absolute inset-0">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center text-left"
            aria-label={`Watch ${title} on TikTok`}
          >
            <PlaybookVideoThumbnail
              thumbnail={thumbnail}
              videoUrl={videoUrl}
              title={title}
              className="absolute inset-0 h-full w-full"
              imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-neutral-950/15 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-primary-500/25 transition group-hover:scale-105">
                <ExternalLink className="h-6 w-6 text-primary-600" />
              </span>
              <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                Watch on TikTok
              </span>
            </div>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="absolute inset-0">
        {playing ? (
          <>
            <iframe
              src={toTikTokPlayerEmbedUrl(videoUrl, true)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIframeReady(true)}
              className="absolute inset-0 h-full w-full border-0"
            />
            {!iframeReady && (
              <PlaybookVideoThumbnail
                thumbnail={thumbnail}
                videoUrl={videoUrl}
                title={title}
                className="absolute inset-0 h-full w-full"
              />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-10 w-[72%] bg-gradient-to-t from-black/25 to-transparent sm:h-12"
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full text-left"
            aria-label={`Play preview of ${title}`}
          >
            <PlaybookVideoThumbnail
              thumbnail={thumbnail}
              videoUrl={videoUrl}
              title={title}
              className="absolute inset-0 h-full w-full"
              imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-neutral-950/15 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-primary-500/25 transition group-hover:scale-105">
                <Play className="h-6 w-6 translate-x-0.5 fill-primary-600 text-primary-600" />
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export { MODAL_PLAYER_CLASS };
