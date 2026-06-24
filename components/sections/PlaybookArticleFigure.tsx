import { articlePhotoCaption } from "@/lib/playbook/article-media";
import { cn } from "@/lib/utils";

type PlaybookArticleFigureProps = {
  src: string;
  alt?: string | null;
  /** ST-style lead image at top of article (video hero, cover image). */
  variant?: "inline" | "lead";
  className?: string;
  children?: React.ReactNode;
};

/**
 * Straits Times–inspired figure: full-width photo, flat edges, credit line beneath.
 * Used for all playbook article images so future uploads share one format.
 */
export function PlaybookArticleFigure({
  src,
  alt,
  variant = "inline",
  className,
  children,
}: PlaybookArticleFigureProps) {
  const caption = articlePhotoCaption(alt);

  return (
    <figure
      className={cn(
        variant === "lead" ? "mt-8" : "my-10 sm:my-12",
        className,
      )}
    >
      <div
        className={cn(
          "w-full overflow-hidden",
          variant === "lead" ? "aspect-video bg-neutral-950" : "bg-neutral-100",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={caption ?? alt ?? ""}
          className={cn(
            "w-full object-center",
            variant === "lead"
              ? "h-full object-contain"
              : "h-auto object-contain",
          )}
          loading={variant === "lead" ? "eager" : "lazy"}
        />
      </div>
      {children}
      {caption && (
        <figcaption className="mt-2 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
