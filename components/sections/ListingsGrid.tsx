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
        <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
              All properties
            </p>
            <h2 className="mt-1 flex flex-wrap items-baseline gap-x-2 font-display font-extrabold tracking-tight text-neutral-900">
              <span className="text-4xl tabular-nums text-primary-600 sm:text-5xl">
                {listings.length.toLocaleString()}
              </span>
              <span className="text-xl sm:text-2xl">
                active listing{listings.length === 1 ? "" : "s"}
              </span>
            </h2>
          </div>
          <p className="text-sm text-neutral-500">
            Updated live from our current portfolio
          </p>
        </div>

        <div className="mb-10">
          <ListingsFilterBar
            filters={filters}
            onFiltersChange={setFilters}
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
            {filtered.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                priority={index < 4}
              />
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
