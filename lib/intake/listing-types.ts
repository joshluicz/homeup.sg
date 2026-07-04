import type { ListingType } from "./types";

export const LISTING_TYPE_OPTIONS: {
  value: ListingType;
  label: string;
  fee: string | null;
}[] = [
  { value: "hdb_room", label: "HDB — room", fee: "$499" },
  { value: "hdb_whole", label: "HDB — whole flat", fee: "$999" },
  { value: "condo_room", label: "Condo — room", fee: "$499" },
  { value: "condo_whole", label: "Condo — whole unit", fee: "$999" },
  { value: "landed_whole", label: "Landed — whole house", fee: "$999" },
  { value: "other", label: "Other", fee: null },
];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = Object.fromEntries(
  LISTING_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ListingType, string>;

export function listingTypeFee(listingType: ListingType): string | null {
  return LISTING_TYPE_OPTIONS.find((o) => o.value === listingType)?.fee ?? null;
}
