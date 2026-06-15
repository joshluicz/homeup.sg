"use client";

import { useEffect, useState } from "react";
import { ListingsGrid } from "@/components/sections/ListingsGrid";
import { ListingsHero } from "@/components/sections/ListingsHero";
import type { Listing } from "@/lib/listings/types";
import { getActiveListings, getListingStats, type ListingStats } from "@/lib/listings/queries";
import { Loader2 } from "lucide-react";

export function ListingsPageClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getActiveListings(), getListingStats()])
      .then(([listingsData, statsData]) => {
        setListings(listingsData);
        setStats(statsData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load listings");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <ListingsHero stats={stats ?? { total: 0, hdb: 0, condo: 0, landed: 0, apartment: 0 }} />
      <ListingsGrid listings={listings} />
    </>
  );
}
