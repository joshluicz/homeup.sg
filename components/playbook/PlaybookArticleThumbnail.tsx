import { cn } from "@/lib/utils";

type PlaybookArticleThumbnailProps = {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
  /** When true, fills a positioned parent (carousel slides). Otherwise uses 16:9 box. */
  fill?: boolean;
};

/** Designed article cover art (1024×576) — show full frame; no crop on text or faces. */
export function PlaybookArticleThumbnail({
  src,
  alt = "",
  className,
  imgClassName,
  loading = "lazy",
  fill = false,
}: PlaybookArticleThumbnailProps) {
  return (
    <div
      className={cn(
        "overflow-hidden bg-neutral-950",
        fill ? "absolute inset-0" : "relative aspect-video w-full",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={cn(
          "block h-full w-full object-contain object-center",
          imgClassName,
        )}
      />
    </div>
  );
}
