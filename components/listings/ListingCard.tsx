"use client";

import Link from "next/link";
import { BedDouble, Bath, Maximize2, MapPin, MessageCircle } from "lucide-react";
import type { Listing } from "@/lib/listings/types";
import {
  flatTypeBadgeLabel,
  formatListingPrice,
  formatListingSize,
  getListingImage,
  listedAsLabel,
} from "@/lib/listings/public-utils";
import { getPublicListingPath } from "@/lib/listings/utils";
import { buildListingWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { trackButtonClick } from "@/lib/analytics";
import { ListingImage } from "@/components/listings/ListingImage";

import { badgeClassForFlatType } from "@/lib/data/property-type-styles";

type ListingCardProps = {
  listing: Listing;
  compact?: boolean;
  layout?: "grid" | "list";
  /** First visible cards load eagerly for faster LCP on /listings. */
  priority?: boolean;
};

export function ListingCard({
  listing,
  compact = false,
  layout = "grid",
  priority = false,
}: ListingCardProps) {
  const typeLabel = flatTypeBadgeLabel(listing.flat_type);
  const priceLabel = formatListingPrice(listing);
  const href = getPublicListingPath(listing.slug);
  const isList = layout === "list";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:border-primary-600/40 hover:shadow-md",
        isList ? "flex flex-col sm:flex-row" : "flex flex-col",
      )}
    >
      <Link
        href={href}
        className={cn(
          "relative block overflow-hidden bg-neutral-100",
          isList ? "aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-52 sm:self-stretch" : "aspect-[4/3] w-full",
        )}
      >
        <ListingImage
          src={getListingImage(listing)}
          alt={listing.title}
          variant={compact ? "compact" : "card"}
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-105"
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

      <div
        className={cn(
          "flex flex-1 flex-col gap-3",
          compact ? "p-3" : "p-4",
          isList && "sm:justify-center",
        )}
      >
        {listing.address_line_1 && (
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <MapPin className="h-3 w-3 shrink-0" />
            {listing.address_line_1}
          </div>
        )}

        <Link href={href}>
          <h3 className="font-display text-sm font-bold leading-snug text-neutral-900 transition-colors group-hover:text-primary-700">
            {listing.title}
          </h3>
        </Link>

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

        {!compact && (
          <div className="mt-auto flex gap-2 pt-1">
            <a
              href={buildListingWhatsAppUrl(listing.title, priceLabel)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); trackButtonClick("WhatsApp Us - Listing Card"); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              WhatsApp Us
            </a>
            <Link
              href={href}
              className="flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              View
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
