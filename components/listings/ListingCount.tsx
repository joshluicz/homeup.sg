"use client";

import { useEffect, useState } from "react";
import { getListingStats } from "@/lib/listings/queries";

type ListingCountProps = {
  suffix?: string;
  className?: string;
};

export function ListingCount({ suffix = "", className }: ListingCountProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getListingStats()
      .then((stats) => setCount(stats.total))
      .catch(() => setCount(null));
  }, []);

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
