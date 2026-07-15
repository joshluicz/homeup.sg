"use client";

import { useEffect, useState } from "react";
import { getListingStats } from "@/lib/listings/queries";

type ListingCountProps = {
  initialCount?: number;
  suffix?: string;
  className?: string;
  /** Shown when count is unknown (SSR-safe fallback for crawlers). */
  fallback?: string;
};

export function ListingCount({
  initialCount,
  suffix = "",
  className,
  fallback = "120+",
}: ListingCountProps) {
  const [count, setCount] = useState<number | null>(initialCount ?? null);

  useEffect(() => {
    // Always soft-refresh from Supabase so stale ISR HTML doesn't leave the
    // wrong count on screen after an admin sync (SSR initialCount is a hint).
    getListingStats()
      .then((stats) => setCount(stats.total))
      .catch(() => {
        if (initialCount == null) setCount(null);
      });
  }, [initialCount]);

  if (count === null) {
    return (
      <span className={className}>
        {fallback}
        {suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      {count}
      {suffix}
    </span>
  );
}
