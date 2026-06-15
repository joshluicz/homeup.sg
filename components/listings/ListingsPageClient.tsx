"use client";

import { useEffect, useState } from "react";
import { ListingsGrid } from "@/components/sections/ListingsGrid";
import { ListingsHero } from "@/components/sections/ListingsHero";
import type { Listing } from "@/lib/listings/types";
import { getActiveListings, getListingStats, type ListingStats } from "@/lib/listings/queries";

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
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
          <div className="h-6 w-24 rounded-md bg-neutral-100" />
          <div className="h-8 w-28 rounded-lg bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

function ListingsSkeleton() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="bg-neutral-50 border-b border-neutral-100 px-6 py-10 animate-pulse">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-8 w-64 rounded-lg bg-neutral-200" />
          <div className="h-4 w-96 rounded bg-neutral-100" />
          <div className="flex gap-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-neutral-200" />
            ))}
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

type Props = {
  initialListings: Listing[];
  initialStats: ListingStats;
};

export function ListingsPageClient({ initialListings, initialStats }: Props) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [stats, setStats] = useState<ListingStats>(initialStats);
  const [loading, setLoading] = useState(initialListings.length === 0);

  useEffect(() => {
    // Refresh in background to pick up changes since the last build
    Promise.all([getActiveListings(), getListingStats()])
      .then(([listingsData, statsData]) => {
        setListings(listingsData);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ListingsSkeleton />;

  return (
    <>
      <ListingsHero stats={stats} />
      <ListingsGrid listings={listings} />
    </>
  );
}
