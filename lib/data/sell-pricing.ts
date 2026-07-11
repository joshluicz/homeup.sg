import {
  getPropertyTypeStyle,
  type PropertyTypePalette,
  type PropertyTypeStyle,
} from "@/lib/data/property-type-styles";

export type SellPropertyType = "HDB" | "Condo" | "Landed";

export type SellTheme = PropertyTypePalette;
export interface SellPlan {
  name: string;
  tag: string;
  theme: SellTheme;
  type: SellPropertyType;
  price: number;
  learnMoreHref: string;
  buttonText: string;
  footnote?: string;
}

export const SELL_PLANS: SellPlan[] = [
  {
    name: "HDB Seller",
    tag: "HDB Flat",
    theme: "sky",
    type: "HDB",
    price: 1999,
    learnMoreHref: "/sell-hdb",
    buttonText: "WhatsApp Us",
  },
  {
    name: "Condo Seller",
    tag: "Condo / EC",
    theme: "indigo",
    type: "Condo",
    price: 4999,
    learnMoreHref: "/sell-condo",
    buttonText: "WhatsApp Us",
    footnote: "Additional 0.5% (sale price) applies if buyer has a co-broke agent",
  },
  {
    name: "Landed Seller",
    tag: "Landed Home",
    theme: "amber",
    type: "Landed",
    price: 9999,
    learnMoreHref: "/sell-landed",
    buttonText: "WhatsApp Us",
    footnote: "Additional 0.5% (sale price) applies if buyer has a co-broke agent",
  },
];

export const SELL_MAX_BY_TYPE: Record<SellPropertyType, number> = {
  HDB: 2_000_000,
  Condo: 4_000_000,
  Landed: 6_000_000,
};

export const SELL_DEFAULT_BY_TYPE: Record<SellPropertyType, number> = {
  HDB: 500_000,
  Condo: 1_500_000,
  Landed: 3_000_000,
};

export const SELL_THEME_STYLES: Record<SellTheme, PropertyTypeStyle> = {
  sky: getPropertyTypeStyle("HDB"),
  indigo: getPropertyTypeStyle("Condo"),
  amber: getPropertyTypeStyle("Landed"),
};
