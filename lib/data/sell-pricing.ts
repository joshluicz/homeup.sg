export type SellPropertyType = "HDB" | "Condo" | "Landed";

export type SellTheme = "blue" | "green" | "amber";

export interface SellPlan {
  name: string;
  tag: string;
  theme: SellTheme;
  type: SellPropertyType;
  price: number;
  learnMoreHref: string;
  buttonText: string;
}

export const SELL_PLANS: SellPlan[] = [
  {
    name: "HDB Seller",
    tag: "HDB Flat",
    theme: "blue",
    type: "HDB",
    price: 1999,
    learnMoreHref: "/sell-hdb",
    buttonText: "Connect with HOMEUP agent",
  },
  {
    name: "Condo Seller",
    tag: "Condo / EC",
    theme: "green",
    type: "Condo",
    price: 4999,
    learnMoreHref: "/sell-condo",
    buttonText: "Connect with HOMEUP agent",
  },
  {
    name: "Landed Seller",
    tag: "Landed Home",
    theme: "amber",
    type: "Landed",
    price: 9999,
    learnMoreHref: "/sell-landed",
    buttonText: "Connect with HOMEUP agent",
  },
];

export const SELL_MAX_BY_TYPE: Record<SellPropertyType, number> = {
  HDB: 2_000_000,
  Condo: 4_000_000,
  Landed: 6_000_000,
};

export const SELL_THEME_STYLES = {
  blue: {
    topBar: "bg-blue-500",
    header: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    price: "text-blue-700",
    check: "text-blue-600",
    cta: "bg-blue-600 text-white hover:bg-blue-700",
    ctaOutline: "border-blue-200 text-blue-700 hover:bg-blue-50",
    shadow: "shadow-[0_4px_24px_rgba(59,130,246,0.12)]",
  },
  green: {
    topBar: "bg-primary-600",
    header: "bg-primary-50",
    border: "border-primary-300",
    badge: "bg-primary-100 text-primary-800",
    price: "text-primary-700",
    check: "text-primary-600",
    cta: "bg-primary-600 text-white hover:bg-primary-700",
    ctaOutline: "border-primary-200 text-primary-700 hover:bg-primary-50",
    shadow: "shadow-[0_4px_32px_rgba(0,154,68,0.15)]",
  },
  amber: {
    topBar: "bg-amber-500",
    header: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-900",
    price: "text-amber-800",
    check: "text-amber-600",
    cta: "bg-amber-600 text-white hover:bg-amber-700",
    ctaOutline: "border-amber-200 text-amber-700 hover:bg-amber-50",
    shadow: "shadow-[0_4px_24px_rgba(245,158,11,0.15)]",
  },
} as const;
