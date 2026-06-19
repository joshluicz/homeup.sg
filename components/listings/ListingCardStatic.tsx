import Link from "next/link";
import type { Listing } from "@/lib/listings/types";
import {
  flatTypeBadgeLabel,
  formatListingPrice,
  formatListingSize,
  getListingImage,
  listedAsLabel,
} from "@/lib/listings/public-utils";
import { getPublicListingPath } from "@/lib/listings/utils";

const typeBadge: Record<string, string> = {
  HDB: "bg-blue-50 text-blue-700 border-blue-200",
  Condo: "bg-primary-50 text-primary-700 border-primary-200",
  Landed: "bg-amber-50 text-amber-700 border-amber-200",
};

type ListingCardStaticProps = {
  listing: Listing;
  compact?: boolean;
};

/** Server-rendered listing card for crawlers and first paint. */
export function ListingCardStatic({ listing, compact = false }: ListingCardStaticProps) {
  const typeLabel = flatTypeBadgeLabel(listing.flat_type);
  const priceLabel = formatListingPrice(listing);
  const href = getPublicListingPath(listing.slug);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <Link href={href} className="relative block aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getListingImage(listing)}
          alt={listing.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ${typeBadge[typeLabel] ?? typeBadge.Condo}`}
          >
            {typeLabel}
          </span>
          {listing.listed_as === "rent" && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 backdrop-blur-sm">
              Rent
            </span>
          )}
        </div>
      </Link>

      <div className={`flex flex-1 flex-col gap-2 ${compact ? "p-3" : "p-4"}`}>
        <h3 className="text-sm font-semibold leading-snug text-neutral-900">
          <Link href={href} className="hover:text-primary-700">
            {listing.title}
          </Link>
        </h3>
        {listing.address_line_1 && (
          <p className="text-xs text-neutral-500">{listing.address_line_1}</p>
        )}
        <p className="font-display text-sm font-bold text-primary-600">{priceLabel}</p>
        <p className="text-xs text-neutral-400">
          {listedAsLabel(listing.listed_as)}
          {listing.rooms != null ? ` · ${listing.rooms} bed` : ""}
          {listing.bathrooms != null ? ` · ${listing.bathrooms} bath` : ""}
          {listing.area_sqft ? ` · ${formatListingSize(Number(listing.area_sqft))}` : ""}
        </p>
      </div>
    </article>
  );
}
