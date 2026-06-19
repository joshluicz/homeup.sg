"use client";

import { useEffect, useState } from "react";
import { ListingsGrid } from "@/components/sections/ListingsGrid";
import { ListingsGridStatic } from "@/components/listings/ListingsGridStatic";
import type { Listing } from "@/lib/listings/types";
import { getActiveListings, type ListingStats } from "@/lib/listings/queries";

function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm animate-pulse">
      <div className="aspect-[4/3] w-full bg-neutral-100" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-neutral-100" />
          <div className="h-5 w-12 rounded-full bg-neutral-100" />
        </div>
        <div className="h-5 w-3/4 rounded-md bg-neutral-100" />
        <div className="h-4 w-1/2 rounded-md bg-neutral-100" />
        <div className="flex gap-4 pt-1">
          <div className="h-4 w-12 rounded bg-neutral-100" />
          <div className="h-4 w-12 rounded bg-neutral-100" />
          <div className="h-4 w-16 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

function ListingsGridSkeleton() {
  return (
    <section className="section-padding bg-white">
      <div className="container-page">
        <div className="mb-10 h-10 w-64 animate-pulse rounded-lg bg-neutral-100" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

type Props = {
  initialListings: Listing[];
  initialStats: ListingStats;
};

export function ListingsPageClient({ initialListings, initialStats }: Props) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const hasInitialData = initialListings.length > 0 || initialStats.total > 0;
  const [loading, setLoading] = useState(!hasInitialData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);

    getActiveListings()
      .then((listingsData) => {
        setListings(listingsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ListingsGridSkeleton />;
  }

  if (!hydrated && hasInitialData) {
    return <ListingsGridStatic listings={listings} />;
  }

  return <ListingsGrid listings={listings} />;
}
