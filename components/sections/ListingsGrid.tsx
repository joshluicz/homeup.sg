"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingsFilterBar } from "@/components/listings/ListingsFilterBar";
import type { Listing } from "@/lib/listings/types";
import {
  DEFAULT_LISTINGS_FILTERS,
  filterListings,
  type ListingsFilterState,
} from "@/lib/listings/listings-filters";

interface ListingsGridProps {
  listings: Listing[];
}

export function ListingsGrid({ listings }: ListingsGridProps) {
  const [filters, setFilters] = useState<ListingsFilterState>(DEFAULT_LISTINGS_FILTERS);

  const filtered = useMemo(() => filterListings(listings, filters), [listings, filters]);

  if (listings.length === 0) {
    return (
      <section className="section-padding bg-white">
        <div className="container-page py-20 text-center">
          <p className="text-sm font-semibold text-neutral-600">No listings yet</p>
          <p className="mt-2 text-sm text-neutral-400">Check back soon for new properties.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-page">
        <div className="mb-10">
          <ListingsFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={filtered.length}
            totalCount={listings.length}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(filters)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold text-neutral-500">No listings match your filters.</p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_LISTINGS_FILTERS)}
              className="mt-3 cursor-pointer text-sm font-semibold text-primary-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
