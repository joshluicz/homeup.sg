import { cn } from "@/lib/utils";

type PlaybookVideoTitleProps = {
  title: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  as?: "h1" | "h2" | "h3" | "p";
  inverted?: boolean;
};

const SIZE_CLASS = {
  sm: "text-[11px] font-bold sm:text-xs",
  md: "text-sm font-bold sm:text-[15px]",
  lg: "text-base font-extrabold sm:text-lg sm:leading-snug",
};

/** Centered video title — use above the player or browse tile. */
export function PlaybookVideoTitle({
  title,
  className,
  size = "lg",
  as: Tag = "p",
  inverted = false,
}: PlaybookVideoTitleProps) {
  return (
    <Tag
      className={cn(
        "mx-auto max-w-[95%] text-center font-display font-bold leading-snug tracking-tight",
        SIZE_CLASS[size],
        inverted ? "text-white" : "text-neutral-900",
        className,
      )}
    >
      {title}
    </Tag>
  );
}
