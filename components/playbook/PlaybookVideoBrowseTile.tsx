import { Play } from "lucide-react";
import { PlaybookVideoThumbnail } from "@/components/playbook/PlaybookVideoThumbnail";
import { cn } from "@/lib/utils";

type PlaybookVideoBrowseTileProps = {
  thumbnail?: string;
  videoUrl?: string;
  title: string;
  duration?: string;
  variant?: "rail" | "grid";
  className?: string;
};

/** 9:16 browse tile — custom title appears at the top on hover; caption below for touch/mobile. */
export function PlaybookVideoBrowseTile({
  thumbnail,
  videoUrl,
  title,
  duration,
  variant = "rail",
  className,
}: PlaybookVideoBrowseTileProps) {
  const isGrid = variant === "grid";

  return (
    <div className={cn("flex flex-col", className)}>
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

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-20",
            "translate-y-[-4px] opacity-0 transition-all duration-200",
            "group-hover/tile:translate-y-0 group-hover/tile:opacity-100",
            "group-focus-visible/tile:translate-y-0 group-focus-visible/tile:opacity-100",
          )}
        >
          <div className="bg-gradient-to-b from-neutral-950/95 via-neutral-950/80 to-transparent px-2.5 pb-10 pt-2.5 sm:px-3 sm:pt-3">
            <p
              className={cn(
                "mx-auto max-w-[95%] text-center font-bold leading-snug text-white drop-shadow-sm",
                isGrid ? "line-clamp-5 text-sm sm:text-[15px]" : "line-clamp-4 text-[11px] sm:text-xs",
              )}
            >
              {title}
            </p>
          </div>
        </div>

        <div className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-white/80">
          <Play className="h-3.5 w-3.5 translate-x-0.5 fill-primary-600 text-primary-600" />
        </div>

        {duration && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-neutral-950/80 px-2 py-0.5 text-xs font-medium text-white">
            {duration}
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-2 line-clamp-2 font-bold leading-snug text-neutral-900",
          isGrid ? "text-sm" : "text-xs",
        )}
      >
        {title}
      </p>
    </div>
  );
}
