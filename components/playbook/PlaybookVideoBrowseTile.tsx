import { Play } from "lucide-react";
import { PlaybookVideoThumbnail } from "@/components/playbook/PlaybookVideoThumbnail";
import { PlaybookVideoTitle } from "@/components/playbook/PlaybookVideoTitle";
import { cn } from "@/lib/utils";

type PlaybookVideoBrowseTileProps = {
  thumbnail?: string;
  videoUrl?: string;
  title: string;
  duration?: string;
  variant?: "rail" | "grid";
  className?: string;
  /** White title text for dark section backgrounds. */
  titleInverted?: boolean;
};

/** 9:16 browse tile — title centered above; hover overlay for rail context. */
export function PlaybookVideoBrowseTile({
  thumbnail,
  videoUrl,
  title,
  duration,
  variant = "rail",
  className,
  titleInverted = false,
}: PlaybookVideoBrowseTileProps) {
  const isGrid = variant === "grid";

  return (
    <div className={cn("flex flex-col", className)}>
      <PlaybookVideoTitle
        title={title}
        size={isGrid ? "md" : "sm"}
        inverted={titleInverted}
        className={cn(
          "mb-2",
          isGrid ? "line-clamp-3 min-h-[4.125em]" : "line-clamp-2 px-0.5 min-h-[2.75em]",
        )}
      />

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl bg-neutral-950 ring-1 ring-neutral-200/80 transition-shadow duration-200",
          "group-hover/tile:ring-primary-500/50 group-focus-visible/tile:ring-primary-500/50",
          "aspect-[9/16]",
        )}
      >
        <PlaybookVideoThumbnail
          thumbnail={thumbnail}
          videoUrl={videoUrl}
          title={title}
          className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover/tile:scale-[1.02] group-focus-visible/tile:scale-[1.02]"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/45 via-transparent to-neutral-950/10" />

        <div className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-white/80">
          <Play className="h-3.5 w-3.5 translate-x-0.5 fill-primary-600 text-primary-600" />
        </div>

        {duration && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-neutral-950/80 px-2 py-0.5 text-xs font-medium text-white">
            {duration}
          </span>
        )}
      </div>
    </div>
  );
}
