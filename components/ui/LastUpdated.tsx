import { SITE_LAST_UPDATED } from "@/lib/seo/content-freshness";
import { cn } from "@/lib/utils";

interface LastUpdatedProps {
  className?: string;
}

/** Inline freshness note (e.g. on About). Page footers use Footer instead. */
export function LastUpdated({ className }: LastUpdatedProps) {
  return (
    <p className={cn("text-xs font-normal text-neutral-400", className)}>
      Last updated: {SITE_LAST_UPDATED}
    </p>
  );
}
