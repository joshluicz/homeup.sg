import { cn } from "@/lib/utils";

interface LastUpdatedProps {
  className?: string;
}

export function LastUpdated({ className }: LastUpdatedProps) {
  return (
    <p className={cn("text-center text-xs font-normal text-neutral-400", className)}>
      Last updated: June 2026
    </p>
  );
}
