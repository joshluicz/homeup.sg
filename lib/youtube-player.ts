let youtubeApiPromise: Promise<void> | null = null;

export function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

type YTPlayer = {
  setPlaybackQuality: (quality: string) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
            onPlaybackQualityChange?: (event: { data: string; target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const QUALITY_PREF = ["highres", "hd1080", "hd720"] as const;
const ACCEPTABLE = new Set<string>(QUALITY_PREF);

/** Best-effort request for max quality (YouTube may still cap by player size / bandwidth). */
export function requestHighestYoutubeQuality(player: YTPlayer) {
  for (const quality of QUALITY_PREF) {
    player.setPlaybackQuality(quality);
  }
}

export function shouldBumpYoutubeQuality(quality: string) {
  return quality.length > 0 && !ACCEPTABLE.has(quality);
}

export type { YTPlayer };
