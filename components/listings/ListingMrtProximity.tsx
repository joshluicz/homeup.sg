"use client";

import { Train } from "lucide-react";
import type { NearestMrtResult } from "@/lib/listings/mrt-proximity";

type Props = {
  nearestMrt: NearestMrtResult | null;
};

export function ListingMrtProximity({ nearestMrt }: Props) {
  if (!nearestMrt) return null;

  return (
    <p className="mt-4 flex items-start gap-3 text-sm leading-snug text-neutral-700">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white"
        aria-hidden="true"
      >
        <Train className="h-4 w-4" />
      </span>
      <span className="pt-1">
        <span className="font-medium text-neutral-900">{nearestMrt.label}</span>
      </span>
    </p>
  );
}
