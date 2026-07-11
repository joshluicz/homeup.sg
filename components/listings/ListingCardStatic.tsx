import Link from "next/link";
import { BedDouble, Bath, Maximize2, MapPin } from "lucide-react";
import type { Listing } from "@/lib/listings/types";
import {
  flatTypeBadgeLabel,
  formatListingPrice,
  formatListingSize,
  getListingImage,
} from "@/lib/listings/public-utils";
import { getPublicListingPath } from "@/lib/listings/utils";
import { ListingImage } from "@/components/listings/ListingImage";
import { badgeClassForFlatType } from "@/lib/data/property-type-styles";
import { cn } from "@/lib/utils";

type ListingCardStaticProps = {
  listing: Listing;
  compact?: boolean;
  priority?: boolean;
};

/** Server-rendered listing card for crawlers and first paint. */
export function ListingCardStatic({ listing, compact = false, priority = false }: ListingCardStaticProps) {
  const typeLabel = flatTypeBadgeLabel(listing.flat_type);
  const priceLabel = formatListingPrice(listing);
  const href = getPublicListingPath(listing.slug);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <Link href={href} className="relative block aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        <ListingImage
          src={getListingImage(listing)}
          alt={listing.title}
          variant={compact ? "compact" : "card"}
          priority={priority}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm",
              badgeClassForFlatType(listing.flat_type),
            )}
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

      <div className={cn("flex flex-1 flex-col gap-3", compact ? "p-3" : "p-4")}>
        {listing.address_line_1 && (
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <MapPin className="h-3 w-3 shrink-0" />
            {listing.address_line_1}
          </div>
        )}

        <h3 className="font-display text-sm font-bold leading-snug text-neutral-900">
          <Link href={href} className="hover:text-primary-700">
            {listing.title}
          </Link>
        </h3>

        <p className="font-display text-base font-extrabold text-primary-600">{priceLabel}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-100 pt-3">
          {listing.rooms != null && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <BedDouble className="h-3.5 w-3.5 shrink-0" />
              {listing.rooms} {listing.rooms === 1 ? "bed" : "beds"}
            </span>
          )}
          {listing.bathrooms != null && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <Bath className="h-3.5 w-3.5 shrink-0" />
              {listing.bathrooms} {listing.bathrooms === 1 ? "bath" : "baths"}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <Maximize2 className="h-3.5 w-3.5 shrink-0" />
            {formatListingSize(Number(listing.area_sqft))}
          </span>
        </div>
      </div>
    </article>
  );
}
