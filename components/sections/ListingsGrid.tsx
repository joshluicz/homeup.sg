"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing } from "@/lib/listings/types";
import type { FlatTypeFilter } from "@/lib/listings/public-utils";
import { flatTypeFilterMatches } from "@/lib/listings/public-utils";
import { cn } from "@/lib/utils";

type SortOption = "default" | "price-asc" | "price-desc" | "size-desc";
type StatusFilter = "All" | "For Sale" | "For Rent";

const TYPE_FILTERS: FlatTypeFilter[] = ["All", "HDB", "Condo", "Landed"];
const STATUS_FILTERS: StatusFilter[] = ["All", "For Sale", "For Rent"];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "size-desc", label: "Size: Largest First" },
];

const typeFilterActive: Record<FlatTypeFilter, string> = {
  All: "bg-neutral-900 text-white border-neutral-900",
  HDB: "bg-blue-600 text-white border-blue-600",
  Condo: "bg-primary-600 text-white border-primary-600",
  Landed: "bg-amber-600 text-white border-amber-600",
};

interface ListingsGridProps {
  listings: Listing[];
}

export function ListingsGrid({ listings }: ListingsGridProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FlatTypeFilter>("All");
  const [statusFilter, setStatus] = useState<StatusFilter>("All");
  const [sort, setSort] = useState<SortOption>("default");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = listings;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.address_line_1?.toLowerCase().includes(q) ?? false),
      );
    }

    if (typeFilter !== "All") {
      result = result.filter((l) => flatTypeFilterMatches(l, typeFilter));
    }

    if (statusFilter === "For Sale") {
      result = result.filter((l) => l.listed_as === "sell");
    } else if (statusFilter === "For Rent") {
      result = result.filter((l) => l.listed_as === "rent");
    }

    if (sort === "price-asc") {
      return [...result].sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sort === "price-desc") {
      return [...result].sort((a, b) => Number(b.price) - Number(a.price));
    }
    if (sort === "size-desc") {
      return [...result].sort((a, b) => Number(b.area_sqft) - Number(a.area_sqft));
    }
    return result;
  }, [listings, search, typeFilter, statusFilter, sort]);

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
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                placeholder="Search by title or address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <button
              onClick={() => setShowFilters((c) => !c)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                showFilters
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Type</p>
                    <div className="flex flex-wrap gap-2">
                      {TYPE_FILTERS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                            typeFilter === t
                              ? typeFilterActive[t]
                              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_FILTERS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(s)}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                            statusFilter === s
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:ml-auto">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Sort by</p>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 focus:border-primary-400 focus:outline-none"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-neutral-400">
            Showing <span className="font-semibold text-neutral-700">{filtered.length}</span> of{" "}
            {listings.length} listings
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${typeFilter}-${statusFilter}-${sort}-${search}`}
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
            <p className="text-sm font-semibold text-neutral-500">No listings match your search.</p>
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("All");
                setStatus("All");
                setSort("default");
              }}
              className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
