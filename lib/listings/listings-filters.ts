import type { Condition, Listing } from "@/lib/listings/types";
import type { FlatTypeFilter } from "@/lib/listings/public-utils";
import { flatTypeFilterMatches } from "@/lib/listings/public-utils";

export type SortOption = "default" | "price-asc" | "price-desc" | "size-desc";
export type StatusFilter = "All" | "For Sale" | "For Rent";
export type TenureFilter = "All" | "Freehold" | "Leasehold";
export type ConditionFilter = "All" | Condition;
export type RoomFilter = "any" | "1" | "2" | "3" | "4" | "5";
export type BathroomFilter = "any" | "1" | "2" | "3+";

export interface ListingsFilterState {
  search: string;
  typeFilter: FlatTypeFilter;
  statusFilter: StatusFilter;
  tenureFilter: TenureFilter;
  conditionFilter: ConditionFilter;
  minRooms: RoomFilter;
  minBathrooms: BathroomFilter;
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  sort: SortOption;
}

export const DEFAULT_LISTINGS_FILTERS: ListingsFilterState = {
  search: "",
  typeFilter: "All",
  statusFilter: "All",
  tenureFilter: "All",
  conditionFilter: "All",
  minRooms: "any",
  minBathrooms: "any",
  minPrice: "",
  maxPrice: "",
  minSize: "",
  maxSize: "",
  sort: "default",
};

export const TYPE_FILTERS: FlatTypeFilter[] = ["All", "HDB", "Condo", "Landed"];
export const STATUS_FILTERS: StatusFilter[] = ["All", "For Sale", "For Rent"];
export const TENURE_FILTERS: TenureFilter[] = ["All", "Freehold", "Leasehold"];
export const CONDITION_FILTERS: { value: ConditionFilter; label: string }[] = [
  { value: "All", label: "Any" },
  { value: "no_furnishing", label: "Unfurnished" },
  { value: "partial", label: "Partially furnished" },
  { value: "fully_furnished", label: "Fully furnished" },
];
export const ROOM_OPTIONS: { value: RoomFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];
export const BATHROOM_OPTIONS: { value: BathroomFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3+", label: "3+" },
];
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "size-desc", label: "Size: Largest First" },
];

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function filterListings(listings: Listing[], filters: ListingsFilterState): Listing[] {
  let result = listings;

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.address_line_1?.toLowerCase().includes(q) ?? false),
    );
  }

  if (filters.typeFilter !== "All") {
    result = result.filter((l) => flatTypeFilterMatches(l, filters.typeFilter));
  }

  if (filters.statusFilter === "For Sale") {
    result = result.filter((l) => l.listed_as === "sell");
  } else if (filters.statusFilter === "For Rent") {
    result = result.filter((l) => l.listed_as === "rent");
  }

  if (filters.tenureFilter === "Freehold") {
    result = result.filter((l) => l.is_freehold);
  } else if (filters.tenureFilter === "Leasehold") {
    result = result.filter((l) => !l.is_freehold);
  }

  if (filters.conditionFilter !== "All") {
    result = result.filter((l) => l.condition === filters.conditionFilter);
  }

  if (filters.minRooms !== "any") {
    const min = Number(filters.minRooms);
    result = result.filter((l) => (l.rooms ?? 0) >= min);
  }

  if (filters.minBathrooms !== "any") {
    const min = filters.minBathrooms === "3+" ? 3 : Number(filters.minBathrooms);
    result = result.filter((l) => (l.bathrooms ?? 0) >= min);
  }

  const minPriceValue = parseOptionalNumber(filters.minPrice);
  const maxPriceValue = parseOptionalNumber(filters.maxPrice);
  const minSizeValue = parseOptionalNumber(filters.minSize);
  const maxSizeValue = parseOptionalNumber(filters.maxSize);

  if (minPriceValue !== null) {
    result = result.filter((l) => Number(l.price) >= minPriceValue);
  }
  if (maxPriceValue !== null) {
    result = result.filter((l) => Number(l.price) <= maxPriceValue);
  }
  if (minSizeValue !== null) {
    result = result.filter((l) => Number(l.area_sqft) >= minSizeValue);
  }
  if (maxSizeValue !== null) {
    result = result.filter((l) => Number(l.area_sqft) <= maxSizeValue);
  }

  if (filters.sort === "price-asc") {
    return [...result].sort((a, b) => Number(a.price) - Number(b.price));
  }
  if (filters.sort === "price-desc") {
    return [...result].sort((a, b) => Number(b.price) - Number(a.price));
  }
  if (filters.sort === "size-desc") {
    return [...result].sort((a, b) => Number(b.area_sqft) - Number(a.area_sqft));
  }
  return result;
}

type FilterScope = "primary" | "more" | "all";

export function countActiveFilters(filters: ListingsFilterState, scope: FilterScope = "all"): number {
  let count = 0;

  if (scope === "all" || scope === "primary") {
    if (filters.typeFilter !== "All") count++;
    if (filters.statusFilter !== "All") count++;
    if (filters.minRooms !== "any") count++;
    if (parseOptionalNumber(filters.minPrice) !== null) count++;
    if (parseOptionalNumber(filters.maxPrice) !== null) count++;
    if (parseOptionalNumber(filters.minSize) !== null) count++;
    if (parseOptionalNumber(filters.maxSize) !== null) count++;
  }

  if (scope === "all" || scope === "more") {
    if (filters.tenureFilter !== "All") count++;
    if (filters.conditionFilter !== "All") count++;
    if (filters.minBathrooms !== "any") count++;
    if (filters.sort !== "default") count++;
  }

  return count;
}

export function typeFilterLabel(value: FlatTypeFilter): string {
  return value === "All" ? "Any type" : value;
}

export function priceFilterLabel(min: string, max: string): string {
  const minVal = parseOptionalNumber(min);
  const maxVal = parseOptionalNumber(max);
  if (minVal !== null && maxVal !== null) return `S$${formatCompact(minVal)} – S$${formatCompact(maxVal)}`;
  if (minVal !== null) return `From S$${formatCompact(minVal)}`;
  if (maxVal !== null) return `Up to S$${formatCompact(maxVal)}`;
  return "Any price";
}

export function roomFilterLabel(value: RoomFilter): string {
  if (value === "any") return "Any beds";
  return value === "5" ? "5+ beds" : `${value} bed${value === "1" ? "" : "s"}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString();
}
