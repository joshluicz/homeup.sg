import type { FlatType } from "@/lib/listings/types";
import type { BuyPropertyType } from "@/lib/data/buy-pricing";
import type { SellPropertyType } from "@/lib/data/sell-pricing";

export type PropertyTypeKey = "HDB" | "Condo" | "Landed";
export type PropertyTypePalette = "sky" | "indigo" | "amber";

export type PropertyTypeStyle = {
  palette: PropertyTypePalette;
  badge: string;
  badgeSolid: string;
  price: string;
  check: string;
  checkBg: string;
  cta: string;
  ctaOutline: string;
  header: string;
  border: string;
  shadow: string;
  accentBorder: string;
  rowAccent: string;
  savingsCell: string;
};

/** Option A — sky / indigo / amber; neutral card bodies with tinted headers. */
export const PROPERTY_TYPE_STYLES: Record<PropertyTypeKey, PropertyTypeStyle> = {
  HDB: {
    palette: "sky",
    badge: "border border-sky-200 bg-sky-50 text-sky-800",
    badgeSolid: "bg-sky-600 text-white",
    price: "text-sky-700",
    check: "text-sky-700",
    checkBg: "bg-sky-100",
    cta: "bg-sky-600 text-white hover:bg-sky-700",
    ctaOutline: "border-sky-200 text-sky-700 hover:bg-sky-50",
    header: "bg-sky-50",
    border: "border-neutral-200",
    shadow: "shadow-sm",
    accentBorder: "border-l-sky-500",
    rowAccent: "",
    savingsCell: "",
  },
  Condo: {
    palette: "indigo",
    badge: "border border-indigo-200 bg-indigo-50 text-indigo-800",
    badgeSolid: "bg-indigo-600 text-white",
    price: "text-indigo-700",
    check: "text-indigo-700",
    checkBg: "bg-indigo-100",
    cta: "bg-indigo-600 text-white hover:bg-indigo-700",
    ctaOutline: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
    header: "bg-indigo-50",
    border: "border-neutral-200",
    shadow: "shadow-sm",
    accentBorder: "border-l-indigo-500",
    rowAccent: "",
    savingsCell: "",
  },
  Landed: {
    palette: "amber",
    badge: "border border-amber-200 bg-amber-50 text-amber-900",
    badgeSolid: "bg-amber-600 text-white",
    price: "text-amber-800",
    check: "text-amber-800",
    checkBg: "bg-amber-100",
    cta: "bg-amber-600 text-white hover:bg-amber-700",
    ctaOutline: "border-amber-200 text-amber-800 hover:bg-amber-50",
    header: "bg-amber-50",
    border: "border-neutral-200",
    shadow: "shadow-sm",
    accentBorder: "border-l-amber-500",
    rowAccent: "",
    savingsCell: "",
  },
};

export function propertyTypeFromFlatType(flatType: FlatType): PropertyTypeKey {
  if (flatType === "hdb") return "HDB";
  if (flatType === "landed") return "Landed";
  return "Condo";
}

export function propertyTypeFromSellType(type: SellPropertyType): PropertyTypeKey {
  return type;
}

export function propertyTypeFromBuyType(type: BuyPropertyType): PropertyTypeKey {
  if (type === "HDB") return "HDB";
  if (type === "CondoLanded") return "Condo";
  return "Landed";
}

export function getPropertyTypeStyle(key: PropertyTypeKey): PropertyTypeStyle {
  return PROPERTY_TYPE_STYLES[key];
}

export function badgeClassForFlatType(flatType: FlatType): string {
  return getPropertyTypeStyle(propertyTypeFromFlatType(flatType)).badge;
}

export function badgeClassForLabel(label: string): string {
  if (label === "HDB" || label === "Condo" || label === "Landed") {
    return getPropertyTypeStyle(label).badge;
  }
  return "border border-neutral-200 bg-neutral-50 text-neutral-700";
}
