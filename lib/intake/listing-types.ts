import type { ListingType } from "./types";

export type ListingTypeOption = {
  value: ListingType;
  property: string;
  unit: string;
  fee: string | null;
};

/** Active choices shown in the intake form (landed excluded). */
export const LISTING_TYPE_OPTIONS: ListingTypeOption[] = [
  { value: "hdb_room", property: "HDB", unit: "Room", fee: "$499" },
  { value: "hdb_whole", property: "HDB", unit: "Whole flat", fee: "$999" },
  { value: "condo_room", property: "Condo", unit: "Room", fee: "$499" },
  { value: "condo_whole", property: "Condo", unit: "Whole unit", fee: "$999" },
  { value: "other", property: "Other", unit: "We'll confirm with you", fee: null },
];

const LEGACY_LISTING_TYPE_LABELS: Partial<Record<ListingType, string>> = {
  landed_whole: "Landed · Whole house",
};

export function formatListingTypeLabel(option: Pick<ListingTypeOption, "property" | "unit">): string {
  return `${option.property} · ${option.unit}`;
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  ...Object.fromEntries(
    LISTING_TYPE_OPTIONS.map((o) => [o.value, formatListingTypeLabel(o)]),
  ),
  ...LEGACY_LISTING_TYPE_LABELS,
} as Record<ListingType, string>;

export function listingTypeFee(listingType: ListingType): string | null {
  return LISTING_TYPE_OPTIONS.find((o) => o.value === listingType)?.fee ?? null;
}
