export interface TikTokVideoRef {
  id: string;
  url: string;
}

function tikTokPlayerSrc(videoId: string) {
  const params = new URLSearchParams({
    loop: "1",
    music_info: "0",
    description: "0",
    rel: "0",
  });
  return `https://www.tiktok.com/player/v1/${videoId}?${params.toString()}`;
}

interface TikTokEmbedProps {
  videos: TikTokVideoRef[];
}

export function TikTokEmbed({ videos }: TikTokEmbedProps) {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {videos.map((video) => (
        <div
          key={video.id}
          className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-sm"
        >
          <div className="relative aspect-[9/16] w-full">
            <iframe
              src={tikTokPlayerSrc(video.id)}
              title={`TikTok video by ${video.url}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="fullscreen"
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
