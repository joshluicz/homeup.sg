import { PlaybookArticleFigure } from "@/components/sections/PlaybookArticleFigure";
import { isDirectVideoFile, resolveThumbnail, toEmbedUrl } from "@/lib/playbook/embed";
import type { PlaybookVideo } from "@/lib/data/playbook";

export function PlaybookArticleHeroMedia({ video }: { video: PlaybookVideo }) {
  const hasVideo = Boolean(video.videoUrl?.trim());
  const cover = resolveThumbnail(video.thumbnail, video.videoUrl);

  if (hasVideo) {
    return (
      <figure id="playbook-article-hero-media" className="mt-8">
        <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-950">
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
        <figcaption className="mt-2 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          HOMEUP VIDEO · Watch along with the full guide below
        </figcaption>
      </figure>
    );
  }

  if (cover) {
    return (
      <PlaybookArticleFigure
        src={cover}
        alt={video.title}
        variant="lead"
        className="mt-8"
      />
    );
  }

  return null;
}
