import type {
  Condition,
  FlatType,
  ListedAs,
  ListingFormData,
  Negotiable,
} from "./listing-types.ts";

/** Raw JSON shape returned by Claude before normalization. */
export interface PropertyGuruExtractionRaw {
  title?: string | null;
  listed_as?: string | null;
  price?: number | null;
  negotiable?: string | null;
  area_sqft?: number | null;
  flat_type?: string | null;
  condition?: string | null;
  rooms?: number | null;
  bathrooms?: number | null;
  tenure?: number | null;
  is_freehold?: boolean | null;
  address_line_1?: string | null;
}

/** Normalized extraction with enum fields resolved. */
export interface PropertyGuruExtraction {
  title: string | null;
  listed_as: ListedAs;
  price: number | null;
  negotiable: Negotiable;
  area_sqft: number | null;
  flat_type: FlatType;
  condition: Condition;
  rooms: number | null;
  bathrooms: number | null;
  tenure: number | null;
  is_freehold: boolean;
  address_line_1: string | null;
}

export type ImportSuccessResponse = {
  success: true;
  data: Partial<ListingFormData>;
  warnings: string[];
};

export type ImportErrorResponse = {
  success: false;
  error: string;
};

export type ImportResponse = ImportSuccessResponse | ImportErrorResponse;

export const MAX_IMAGES = 15;
export const MAX_HTML_CHARS = 40_000;

export const PG_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

export const FETCH_BLOCK_PATTERNS = [
  /just a moment/i,
  /cf-challenge/i,
  /captcha/i,
  /access denied/i,
  /<title>\s*attention required/i,
  /cloudflare/i,
];

const FLAT_TYPE_MAP: Record<string, FlatType> = {
  condominium: "condominium",
  condo: "condominium",
  hdb: "hdb",
  "public housing": "hdb",
  landed: "landed",
  "landed property": "landed",
  "landed house": "landed",
  terrace: "landed",
  "semi-detached": "landed",
  bungalow: "landed",
  apartment: "apartment",
  "executive apartment": "apartment",
  "service apartment": "apartment",
};

const CONDITION_MAP: Record<string, Condition> = {
  no_furnishing: "no_furnishing",
  unfurnished: "no_furnishing",
  "no furnishing": "no_furnishing",
  partial: "partial",
  "partially furnished": "partial",
  "partial furnishing": "partial",
  fully_furnished: "fully_furnished",
  furnished: "fully_furnished",
  "fully furnished": "fully_furnished",
};

const LISTED_AS_MAP: Record<string, ListedAs> = {
  rent: "rent",
  rental: "rent",
  "for rent": "rent",
  "for-rent": "rent",
  sell: "sell",
  sale: "sell",
  "for sale": "sell",
  "for-sale": "sell",
};

const NEGOTIABLE_MAP: Record<string, Negotiable> = {
  negotiable: "negotiable",
  starting_from: "starting_from",
  "starting from": "starting_from",
};

export function normalizeFlatType(raw: string | null | undefined): FlatType {
  if (!raw) return "condominium";
  const key = raw.toLowerCase().trim();
  return FLAT_TYPE_MAP[key] ?? "condominium";
}

export function normalizeCondition(raw: string | null | undefined): Condition {
  if (!raw) return "no_furnishing";
  const key = raw.toLowerCase().trim();
  return CONDITION_MAP[key] ?? "no_furnishing";
}

export function normalizeListedAs(
  raw: string | null | undefined,
  urlHint?: string,
): ListedAs {
  if (raw) {
    const key = raw.toLowerCase().trim();
    if (LISTED_AS_MAP[key]) return LISTED_AS_MAP[key];
  }
  if (urlHint) {
    const lower = urlHint.toLowerCase();
    if (lower.includes("for-rent") || lower.includes("/rent")) return "rent";
    if (lower.includes("for-sale") || lower.includes("/sale")) return "sell";
  }
  return "sell";
}

export function normalizeNegotiable(raw: string | null | undefined): Negotiable {
  if (!raw) return "negotiable";
  const key = raw.toLowerCase().trim();
  return NEGOTIABLE_MAP[key] ?? "negotiable";
}

export function coerceNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function coerceInteger(value: unknown): number | null {
  const n = coerceNumber(value);
  return n == null ? null : Math.round(n);
}
