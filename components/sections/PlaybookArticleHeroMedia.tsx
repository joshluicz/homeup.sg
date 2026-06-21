import { isDirectVideoFile, resolveThumbnail, toEmbedUrl } from "@/lib/playbook/embed";
import type { PlaybookVideo } from "@/lib/data/playbook";

export function PlaybookArticleHeroMedia({ video }: { video: PlaybookVideo }) {
  const hasVideo = Boolean(video.videoUrl?.trim());
  const cover = resolveThumbnail(video.thumbnail, video.videoUrl);

  if (hasVideo) {
    return (
      <figure id="playbook-article-hero-media" className="mt-8">
        <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-950">
          {isDirectVideoFile(video.videoUrl) ? (
            <video
              src={video.videoUrl}
              title={video.title}
              controls
              playsInline
              poster={cover || undefined}
              className="h-full w-full object-cover"
            />
          ) : (
            <iframe
              src={toEmbedUrl(video.videoUrl)}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          )}
        </div>
        <figcaption className="mt-3 text-sm font-normal leading-relaxed text-neutral-500">
          Watch along with the full guide below.
        </figcaption>
      </figure>
    );
  }

  if (cover) {
    return (
      <figure id="playbook-article-hero-media" className="mt-8">
        <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100">
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </figure>
    );
  }

  return null;
}
