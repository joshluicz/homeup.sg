"use client";

import { useEffect, useId, useRef } from "react";
import {
  loadYoutubeIframeApi,
  requestHighestYoutubeQuality,
  shouldBumpYoutubeQuality,
  type YTPlayer,
} from "@/lib/youtube-player";

interface YoutubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
  autoplay?: boolean;
}

export function YoutubeEmbed({ videoId, title, className, autoplay = false }: YoutubeEmbedProps) {
  const containerId = useId().replace(/:/g, "");
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadYoutubeIframeApi();
      if (cancelled || !window.YT) return;

      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          fs: 1,
          origin: window.location.origin,
          ...(autoplay ? { autoplay: 1, mute: 1 } : {}),
        },
        events: {
          onReady: (event) => requestHighestYoutubeQuality(event.target),
          onStateChange: (event) => {
            if (event.data === window.YT!.PlayerState.BUFFERING) {
              requestHighestYoutubeQuality(event.target);
            }
          },
          onPlaybackQualityChange: (event) => {
            if (shouldBumpYoutubeQuality(event.data)) {
              requestHighestYoutubeQuality(event.target);
            }
          },
        },
      });
    }

    void init();

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, containerId, autoplay]);

  return (
    <div
      id={containerId}
      className={className}
      title={title}
      aria-label={title}
    />
  );
}
