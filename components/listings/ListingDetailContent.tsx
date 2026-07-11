import type { ComponentType } from "react";
import Link from "next/link";
import { BedDouble, Bath, Maximize2, MapPin, ArrowLeft } from "lucide-react";
import { ListingImageGallery } from "@/components/listings/ListingImageGallery";
import { ListingAffordabilityCalculator } from "@/components/listings/ListingAffordabilityCalculator";
import { ListingKeySpecs } from "@/components/listings/ListingKeySpecs";
import { ListingMrtProximity } from "@/components/listings/ListingMrtProximity";
import { ListingNearbyMap } from "@/components/listings/ListingNearbyMap";
import { ListingCardStatic } from "@/components/listings/ListingCardStatic";
import { ListingWhatsAppButton } from "@/components/listings/ListingWhatsAppButton";
import type { Listing } from "@/lib/listings/types";
import {
  flatTypeBadgeLabel,
  formatListingPrice,
  formatListingSize,
  formatTenure,
  getListingGallery,
  getListingAreaSqm,
  getListingPricePsf,
  listedAsLabel,
} from "@/lib/listings/public-utils";
import { CONDITION_LABELS, FLAT_TYPE_LABELS } from "@/lib/listings/utils";
import { getRelatedPlaybookVideos } from "@/lib/data/playbook";
import { buildListingWhatsAppUrl } from "@/lib/whatsapp";
import { buildListingLocationQuery } from "@/lib/listings/nearby-places";
import type { NearestMrtResult } from "@/lib/listings/mrt-proximity";
import { badgeClassForFlatType } from "@/lib/data/property-type-styles";
import { cn } from "@/lib/utils";

type ListingDetailContentProps = {
  listing: Listing;
  related?: Listing[];
  mapCoords?: { lat: number; lng: number } | null;
  nearestMrt?: NearestMrtResult | null;
};

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-neutral-900">
        {Icon && <Icon className="h-3.5 w-3.5 text-neutral-400" />}
        {value}
      </p>
    </div>
  );
}

export function ListingDetailContent({
  listing,
  related = [],
  mapCoords = null,
  nearestMrt = null,
}: ListingDetailContentProps) {
  const gallery = getListingGallery(listing);
  const priceLabel = formatListingPrice(listing);
  const pricePsf = getListingPricePsf(listing);
  const areaSqm = getListingAreaSqm(listing);
  const playbookVideos = getRelatedPlaybookVideos({
    flat_type: listing.flat_type,
    listed_as: listing.listed_as,
  });
  const typeLabel = flatTypeBadgeLabel(listing.flat_type);
  const whatsAppHref = buildListingWhatsAppUrl(listing.title, priceLabel);

  const specSummary = [
    listing.rooms != null ? `${listing.rooms} bedrooms` : null,
    listing.bathrooms != null ? `${listing.bathrooms} bathrooms` : null,
    listing.area_sqft ? formatListingSize(Number(listing.area_sqft)) : null,
    formatTenure(listing),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-white">
      <noscript>
        <div className="container-page border-b border-neutral-100 py-6">
          <h1 className="font-display text-2xl font-extrabold text-neutral-900">{listing.title}</h1>
          {listing.address_line_1 && (
            <p className="mt-2 text-sm text-neutral-600">{listing.address_line_1}</p>
          )}
          <p className="mt-2 text-lg font-bold text-primary-600">{priceLabel}</p>
          {specSummary && <p className="mt-2 text-sm text-neutral-600">{specSummary}</p>}
          <p className="mt-4">
            <a href={whatsAppHref} className="text-sm font-semibold text-primary-600">
              WhatsApp Us
            </a>
          </p>
        </div>
      </noscript>

      <div className="container-page py-8 sm:py-12">
        <Link
          href="/listings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          All listings
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <ListingImageGallery images={gallery} alt={listing.title} />
          </div>

          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-0.5 text-xs font-semibold",
                  badgeClassForFlatType(listing.flat_type),
                )}
              >
                {typeLabel}
              </span>
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-0.5 text-xs font-semibold text-neutral-700">
                {listedAsLabel(listing.listed_as)}
              </span>
            </div>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
              {listing.title}
            </h1>

            {listing.address_line_1 && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin className="h-4 w-4 shrink-0" />
                {listing.address_line_1}
              </p>
            )}

            <p className="mt-4 font-display text-2xl font-extrabold text-primary-600">{priceLabel}</p>

            <ListingKeySpecs listing={listing} />
            <ListingMrtProximity nearestMrt={nearestMrt} />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {listing.rooms != null && (
                <Spec icon={BedDouble} label="Bedrooms" value={String(listing.rooms)} />
              )}
              {listing.bathrooms != null && (
                <Spec icon={Bath} label="Bathrooms" value={String(listing.bathrooms)} />
              )}
              <Spec icon={Maximize2} label="Floor area" value={formatListingSize(Number(listing.area_sqft))} />
              {areaSqm != null && <Spec label="Area (sqm)" value={`${areaSqm} sqm`} />}
              {pricePsf != null && <Spec label="Price psf" value={`$${pricePsf.toLocaleString()}`} />}
              <Spec label="Tenure" value={formatTenure(listing)} />
              <Spec label="Property type" value={FLAT_TYPE_LABELS[listing.flat_type] ?? listing.flat_type} />
              <Spec label="Condition" value={CONDITION_LABELS[listing.condition] ?? listing.condition} />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ListingWhatsAppButton href={whatsAppHref} />
            </div>
          </div>
        </div>
      </div>

      <ListingNearbyMap
        locationQuery={buildListingLocationQuery(listing)}
        displayAddress={listing.address_line_1 ?? listing.title}
        title={listing.title}
        initialCoords={mapCoords}
      />

      {listing.listed_as === "sell" && listing.price > 0 && (
        <ListingAffordabilityCalculator
          propertyPrice={Number(listing.price)}
          flatType={listing.flat_type}
        />
      )}

      {related.length > 0 && (
        <section className="border-t border-neutral-100 bg-neutral-50 section-padding">
          <div className="container-page">
            <h2 className="mb-6 font-display text-lg font-bold text-neutral-900">
              You might be interested in these
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ListingCardStatic key={item.id} listing={item} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {playbookVideos.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-page">
            <h2 className="mb-2 font-display text-lg font-bold text-neutral-900">
              Learn more about {typeLabel.toLowerCase()}{" "}
              {listing.listed_as === "sell" ? "selling" : "renting"}
            </h2>
            <p className="mb-6 text-sm text-neutral-500">
              Guides from the HomeUP Playbook to help you make informed decisions.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {playbookVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/playbook?video=${video.slug}`}
                  className="group flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700">
                      {video.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{video.description}</p>
                    <span className="mt-2 inline-block text-xs font-semibold text-primary-600">
                      Watch in Playbook
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
