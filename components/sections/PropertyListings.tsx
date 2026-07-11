"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingCount } from "@/components/listings/ListingCount";
import { SectionBlendTop } from "@/components/ui/SectionBlend";
import type { Listing } from "@/lib/listings/types";
import type { FlatTypeFilter } from "@/lib/listings/public-utils";
import { flatTypeFilterMatches } from "@/lib/listings/public-utils";
import { getActiveListings } from "@/lib/listings/queries";
import { Loader2 } from "lucide-react";

const PREVIEW_COUNT = 6;

type FilterType = FlatTypeFilter;

const FILTERS: FilterType[] = ["All", "HDB", "Condo", "Landed"];

const filterActive: Record<FilterType, string> = {
  All: "bg-neutral-900 text-white border-neutral-900",
  HDB: "bg-blue-600 text-white border-blue-600",
  Condo: "bg-primary-600 text-white border-primary-600",
  Landed: "bg-amber-600 text-white border-amber-600",
};

export function PropertyListings({
  listingCount,
  initialListings,
}: {
  listingCount?: number;
  initialListings?: Listing[];
}) {
  const [listings, setListings] = useState<Listing[]>(initialListings ?? []);
  const [loading, setLoading] = useState(!initialListings?.length);
  const [filter, setFilter] = useState<FilterType>("All");

  useEffect(() => {
    if (initialListings?.length) return;
    getActiveListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }, [initialListings?.length]);

  const filtered = useMemo(
    () => (filter === "All" ? listings : listings.filter((l) => flatTypeFilterMatches(l, filter))),
    [listings, filter],
  );

  const preview = filtered.slice(0, PREVIEW_COUNT);
  const hasMore = filtered.length > PREVIEW_COUNT;

  return (
    <section aria-label="Current property listings" className="relative overflow-hidden bg-white section-padding">
      <SectionBlendTop from="neutral-50" />
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Current Listings</Eyebrow>
          <h2 className="section-title">
            <ListingCount initialCount={listingCount} className="text-primary-600" suffix=" active listings" /> across Singapore
          </h2>
        </FadeInUp>

        <FadeInUp delay={0.08}>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  filter === f ? filterActive[f] : "border-neutral-200 bg-white text-neutral-600",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
        </FadeInUp>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : preview.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">No listings available yet.</p>
        ) : (
          <FadeInUp delay={0.12}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} compact priority={index < 3} />
              ))}
            </div>
          </FadeInUp>
        )}

        {(hasMore || listings.length > 0) && (
          <FadeInUp delay={0.16} className="mt-8 text-center">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-6 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
            >
              Browse all listings
            </Link>
          </FadeInUp>
        )}
      </div>
    </section>
  );
}
