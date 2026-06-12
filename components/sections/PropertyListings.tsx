"use client";
import { useMemo, useState } from "react";
import { BedDouble, Bath, Maximize2 } from "lucide-react";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";
import { LISTINGS, LISTINGS_URL } from "@/lib/data/listings";
import type { Listing } from "@/lib/data/listings";

const listings = LISTINGS;
const TOTAL = LISTINGS.length;
const MOBILE_PREVIEW = 6;

type FilterType = "All" | "HDB" | "Condo" | "Landed";

const FILTERS: FilterType[] = ["All", "HDB", "Condo", "Landed"];

const typeBadge: Record<string, string> = {
  HDB:    "bg-blue-50 text-blue-700 border-blue-200",
  Condo:  "bg-primary-50 text-primary-700 border-primary-200",
  Landed: "bg-amber-50 text-amber-700 border-amber-200",
};

const filterActive: Record<FilterType, string> = {
  All:    "bg-neutral-900 text-white border-neutral-900",
  HDB:    "bg-blue-600 text-white border-blue-600",
  Condo:  "bg-primary-600 text-white border-primary-600",
  Landed: "bg-amber-600 text-white border-amber-600",
};

function ListingCard({ l }: { l: Listing }) {
  return (
    <a
      href={l.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
    >
      {/* Property photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={l.image}
          alt={l.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Type badge overlay */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm ${typeBadge[l.type]}`}>
            {l.type}
          </span>
          {l.status === "For Rent" && (
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 backdrop-blur-sm">
              Rent
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1.5 p-3">
        <p className="text-sm font-semibold leading-snug text-neutral-900 group-hover:text-primary-700">
          {l.name}
        </p>

        <p className="font-display text-sm font-bold text-primary-600">{l.price}</p>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {l.beds !== null && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
              <BedDouble className="h-3 w-3 shrink-0" />{l.beds}
            </span>
          )}
          {l.baths !== null && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
              <Bath className="h-3 w-3 shrink-0" />{l.baths}
            </span>
          )}
          {l.size !== "—" && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
              <Maximize2 className="h-3 w-3 shrink-0" />{l.size}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export function PropertyListings() {
  const [filter, setFilter] = useState<FilterType>("All");

  const filtered = useMemo(
    () => (filter === "All" ? listings : listings.filter((l) => l.type === filter)),
    [filter],
  );

  const mobileVisible = filtered.slice(0, MOBILE_PREVIEW);
  const hasMoreOnMobile = filtered.length > MOBILE_PREVIEW;

  return (
    <section aria-label="Current property listings" className="bg-white section-padding">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Current Listings</Eyebrow>
          <h2 className="section-title">
            <span className="text-primary-600">120+ active listings</span> across Singapore
          </h2>
        </FadeInUp>

        {/* Mobile filter */}
        <FadeInUp delay={0.08}>
          <div className="mb-4 flex flex-wrap justify-center gap-2 lg:hidden">
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

        {/* Mobile: capped preview */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {mobileVisible.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>

        {hasMoreOnMobile && (
          <p className="mt-3 text-center text-sm text-neutral-500 lg:hidden">
            More listings available on HOMEUP.sg
          </p>
        )}

        {/* Desktop: full grid */}
        <div className="hidden grid-cols-3 gap-3 lg:grid xl:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>

        <FadeInUp delay={0.15}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/listings"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
            >
              Browse all listings →
            </Link>
            <a
              href={LISTINGS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
            >
              View on HOMEUP.sg ↗
            </a>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
