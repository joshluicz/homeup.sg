import { BedDouble, Bath, Maximize2, Wallet } from "lucide-react";
import type { Listing } from "@/lib/listings/types";
import {
  formatListingSize,
  getListingPricePsf,
} from "@/lib/listings/public-utils";

type Props = {
  listing: Listing;
};

export function ListingKeySpecs({ listing }: Props) {
  const pricePsf = getListingPricePsf(listing);
  const items = [
    listing.rooms != null
      ? { icon: BedDouble, value: String(listing.rooms), label: "Beds" }
      : null,
    listing.bathrooms != null
      ? { icon: Bath, value: String(listing.bathrooms), label: "Baths" }
      : null,
    listing.area_sqft
      ? { icon: Maximize2, value: formatListingSize(Number(listing.area_sqft)), label: null }
      : null,
    pricePsf != null
      ? {
          icon: Wallet,
          value: `S$ ${pricePsf.toLocaleString("en-SG")} psf`,
          label: null,
        }
      : null,
  ].filter(Boolean) as {
    icon: typeof BedDouble;
    value: string;
    label: string | null;
  }[];

  if (items.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-neutral-100 pb-5">
      {items.map(({ icon: Icon, value, label }) => (
        <div key={`${value}-${label ?? "spec"}`} className="flex items-center gap-2 text-sm text-neutral-700">
          <Icon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          <span>
            <span className="font-semibold text-neutral-900">{value}</span>
            {label ? ` ${label}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
