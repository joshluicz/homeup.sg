"use client";

import { useState, useMemo } from "react";
import { BedDouble, Bath, Maximize2, MapPin, Search, MessageCircle, ExternalLink, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Listing, PropertyType, ListingStatus } from "@/lib/data/listings";
import { LISTINGS_URL } from "@/lib/data/listings";
import { buildListingWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type SortOption = "default" | "price-asc" | "price-desc" | "size-desc";

const TYPE_FILTERS: ("All" | PropertyType)[] = ["All", "HDB", "Condo", "Landed"];
const STATUS_FILTERS: ("All" | ListingStatus)[] = ["All", "For Sale", "For Rent"];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default",    label: "Default" },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "size-desc",  label: "Size: Largest First" },
];

const typeBadge: Record<PropertyType, string> = {
  HDB:    "bg-blue-50 text-blue-700 border-blue-200",
  Condo:  "bg-primary-50 text-primary-700 border-primary-200",
  Landed: "bg-amber-50 text-amber-700 border-amber-200",
};

const typeFilterActive: Record<"All" | PropertyType, string> = {
  All:    "bg-neutral-900 text-white border-neutral-900",
  HDB:    "bg-blue-600 text-white border-blue-600",
  Condo:  "bg-primary-600 text-white border-primary-600",
  Landed: "bg-amber-600 text-white border-amber-600",
};

function buildWhatsAppUrl(listing: Listing) {
  return buildListingWhatsAppUrl(listing.name, listing.price);
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:border-primary-600/40 hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.image}
          alt={`${listing.name}, ${listing.type} ${listing.status.toLowerCase()} in Singapore, ${listing.price}`}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm", typeBadge[listing.type])}>
            {listing.type}
          </span>
          {listing.status === "For Rent" && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 backdrop-blur-sm">
              Rent
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* District */}
        {listing.district && (
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <MapPin className="h-3 w-3 shrink-0" />
            {listing.district}
          </div>
        )}

        {/* Name */}
        <h3 className="font-display text-sm font-bold leading-snug text-neutral-900 transition-colors group-hover:text-primary-700">
          {listing.name}
        </h3>

        {/* Price */}
        <p className="font-display text-base font-extrabold text-primary-600">
          {listing.price}
        </p>

        {/* Specs */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-100 pt-3">
          {listing.beds !== null && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <BedDouble className="h-3.5 w-3.5 shrink-0" />
              {listing.beds} {listing.beds === 1 ? "bed" : "beds"}
            </span>
          )}
          {listing.baths !== null && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <Bath className="h-3.5 w-3.5 shrink-0" />
              {listing.baths} {listing.baths === 1 ? "bath" : "baths"}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <Maximize2 className="h-3.5 w-3.5 shrink-0" />
            {listing.size}
          </span>
        </div>

        {/* CTAs */}
        <div className="mt-auto flex gap-2 pt-1">
          <a
            href={buildWhatsAppUrl(listing)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            Enquire
          </a>
          <a
            href={listing.url ?? LISTINGS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${listing.name} on HOMEUP`}
            className="flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

interface ListingsGridProps {
  listings: Listing[];
}

export function ListingsGrid({ listings }: ListingsGridProps) {
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | PropertyType>("All");
  const [statusFilter, setStatus]   = useState<"All" | ListingStatus>("All");
  const [sort, setSort]             = useState<SortOption>("default");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = listings;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.district?.toLowerCase().includes(q) ?? false)
      );
    }

    if (typeFilter !== "All") result = result.filter((l) => l.type === typeFilter);
    if (statusFilter !== "All") result = result.filter((l) => l.status === statusFilter);

    if (sort === "price-asc")  return [...result].sort((a, b) => a.priceValue - b.priceValue);
    if (sort === "price-desc") return [...result].sort((a, b) => b.priceValue - a.priceValue);
    if (sort === "size-desc")  return [...result].sort((a, b) => b.sizeValue - a.sizeValue);
    return result;
  }, [listings, search, typeFilter, statusFilter, sort]);

  return (
    <section className="section-padding bg-white">
      <div className="container-page">

        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-4">

          {/* Search + filter toggle row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                placeholder="Search by name or district…"
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
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Collapsible filter panel */}
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

                  {/* Type filter */}
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
                              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status filter */}
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
                              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="sm:ml-auto">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Sort by</p>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 focus:border-primary-400 focus:outline-none"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <p className="text-xs text-neutral-400">
            Showing <span className="font-semibold text-neutral-700">{filtered.length}</span> of {listings.length} listings
          </p>
        </div>

        {/* ── Grid ──────────────────────────────────────────────────── */}
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
              onClick={() => { setSearch(""); setTypeFilter("All"); setStatus("All"); setSort("default"); }}
              className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* View all link */}
        <div className="mt-10 text-center">
          <a
            href={LISTINGS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-6 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
          >
            <ExternalLink className="h-4 w-4" />
            View full listings on HOMEUP.sg
          </a>
        </div>
      </div>
    </section>
  );
}
