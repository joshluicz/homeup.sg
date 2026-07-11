import { cn } from "@/lib/utils";

type BlendTone = "white" | "neutral-50" | "primary-50";

const BLEND_FROM: Record<BlendTone, string> = {
  white: "from-white",
  "neutral-50": "from-neutral-50",
  "primary-50": "from-primary-50/70",
};

/** Soft top edge fade when a section background changes from the tone above. */
export function SectionBlendTop({ from }: { from: BlendTone }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b to-transparent",
        BLEND_FROM[from],
      )}
    />
  );
}
