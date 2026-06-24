import { PlaybookArticleFigure } from "@/components/sections/PlaybookArticleFigure";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { resolveArticleThumbnail } from "@/lib/playbook/article-thumbnails";

/** Articles only — no embedded video (videos live on /playbook). */
export function PlaybookArticleHeroMedia({ video }: { video: PlaybookVideo }) {
  const cover = resolveArticleThumbnail(video);
  if (!cover) return null;

  return (
    <PlaybookArticleFigure
      src={cover}
      alt={video.title}
      variant="lead"
      className="mt-8"
    />
  );
}
