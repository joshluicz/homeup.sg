"use client";
import { useMemo, useState } from "react";
import { BedDouble, Bath, Maximize2 } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";

interface Listing {
  id: number;
  name: string;
  price: string;
  beds: number | null;
  baths: number | null;
  size: string;
  type: "HDB" | "Condo" | "Landed";
  isRental?: boolean;
}

const listings: Listing[] = [
  { id: 1,  name: "68 Geylang Bahru",          price: "$438,888",    beds: 2,    baths: 1,    size: "700 sqft",   type: "HDB" },
  { id: 2,  name: "D'Ixoras",                   price: "$1,450,000",  beds: 2,    baths: 2,    size: "840 sqft",   type: "Condo" },
  { id: 3,  name: "The Botany at Dairy Farm",   price: "$2,398,000",  beds: 3,    baths: 2,    size: "1,033 sqft", type: "Condo" },
  { id: 4,  name: "94 Dawson Road",             price: "$1,288,000",  beds: 3,    baths: 2,    size: "893 sqft",   type: "HDB" },
  { id: 5,  name: "Bartley Vue",                price: "$2,299,900",  beds: null, baths: null, size: "947 sqft",   type: "Condo" },
  { id: 6,  name: "Eight Riversuites",          price: "$2,699,000",  beds: null, baths: null, size: "1,356 sqft", type: "Condo" },
  { id: 7,  name: "Oleander Towers",            price: "$1,899,000",  beds: 3,    baths: 3,    size: "1,151 sqft", type: "Condo" },
  { id: 8,  name: "Arc at Tampines",            price: "$5,500 / mo", beds: 3,    baths: 3,    size: "1,679 sqft", type: "Condo", isRental: true },
  { id: 9,  name: "Novelis @ Novena",           price: "$1,880,000",  beds: 2,    baths: 2,    size: "839 sqft",   type: "Condo" },
  { id: 10, name: "Cairnhill Residences",       price: "$3,400,000",  beds: 3,    baths: 3,    size: "1,174 sqft", type: "Condo" },
  { id: 11, name: "Tampines St 45",             price: "$648,000",    beds: 4,    baths: 2,    size: "1,195 sqft", type: "HDB" },
  { id: 12, name: "Bishan St 23",               price: "$778,000",    beds: 3,    baths: 2,    size: "930 sqft",   type: "HDB" },
  { id: 13, name: "One-North Eden",             price: "$1,780,000",  beds: 2,    baths: 2,    size: "732 sqft",   type: "Condo" },
  { id: 14, name: "Punggol Central",            price: "$528,000",    beds: 3,    baths: 2,    size: "893 sqft",   type: "HDB" },
  { id: 15, name: "Marine Blue",                price: "$2,180,000",  beds: 2,    baths: 2,    size: "980 sqft",   type: "Condo" },
  { id: 16, name: "Jurong West St 61",          price: "$578,000",    beds: 4,    baths: 2,    size: "1,140 sqft", type: "HDB" },
  { id: 17, name: "Rivière",                    price: "$3,080,000",  beds: 3,    baths: 2,    size: "1,109 sqft", type: "Condo" },
  { id: 18, name: "Sengkang West Ave",          price: "$542,000",    beds: 3,    baths: 2,    size: "893 sqft",   type: "HDB" },
  { id: 19, name: "Dairy Farm Residences",      price: "$1,650,000",  beds: 2,    baths: 2,    size: "764 sqft",   type: "Condo" },
  { id: 20, name: "Bukit Timah Link",           price: "$5,200,000",  beds: 4,    baths: 3,    size: "2,400 sqft", type: "Landed" },
];

const LISTINGS_URL = "https://homeup.sg/property-listing/";
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
      href={LISTINGS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-sm font-medium ${typeBadge[l.type]}`}>
          {l.type}
        </span>
        {l.isRental && (
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-sm font-medium text-amber-700">
            Rent
          </span>
        )}
      </div>

      <p className="text-sm font-semibold leading-snug text-neutral-900 group-hover:text-primary-700">
        {l.name}
      </p>

      <p className="font-display text-sm font-bold text-primary-600">{l.price}</p>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {l.beds !== null && (
          <span className="inline-flex items-center gap-1 text-sm font-normal text-neutral-400">
            <BedDouble className="h-3 w-3 shrink-0" />{l.beds}
          </span>
        )}
        {l.baths !== null && (
          <span className="inline-flex items-center gap-1 text-sm font-normal text-neutral-400">
            <Bath className="h-3 w-3 shrink-0" />{l.baths}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-sm font-normal text-neutral-400">
          <Maximize2 className="h-3 w-3 shrink-0" />{l.size}
        </span>
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
            More than <span className="text-primary-600">100 active listings</span> across Singapore
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
            More listings available on HomeUP.sg
          </p>
        )}

        {/* Desktop: full grid */}
        <div className="hidden grid-cols-3 gap-3 lg:grid xl:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>

        <FadeInUp delay={0.15}>
          <div className="mt-8 text-center">
            <a
              href={LISTINGS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
            >
              View all listings →
            </a>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
