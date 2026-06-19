"use client";

import { useEffect, useState } from "react";
import { getListingStats } from "@/lib/listings/queries";

type ListingCountProps = {
  initialCount?: number;
  suffix?: string;
  className?: string;
};

export function ListingCount({ initialCount, suffix = "", className }: ListingCountProps) {
  const [count, setCount] = useState<number | null>(initialCount ?? null);

  useEffect(() => {
    if (initialCount != null) return;
    getListingStats()
      .then((stats) => setCount(stats.total))
      .catch(() => setCount(null));
  }, [initialCount]);

  if (count === null) {
    return <span className={className}>—{suffix}</span>;
  }

  return (
    <span className={className}>
      {count}
      {suffix}
    </span>
  );
}
