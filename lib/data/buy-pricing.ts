import {
  getPropertyTypeStyle,
  type PropertyTypePalette,
  type PropertyTypeStyle,
} from "@/lib/data/property-type-styles";

export type BuyPropertyType = "HDB" | "CondoLanded" | "NewLaunch";

export type BuyTheme = PropertyTypePalette;

export interface BuyPlan {
  name: string;
  tag: string;
  theme: BuyTheme;
  type: BuyPropertyType;
  price: string;
  description: string;
  learnMoreHref: string;
  buttonText: string;
  includes: string[];
}

export const BUY_NO_FEE_LABEL = "No Fees";

export const BUY_PLANS: BuyPlan[] = [
  {
    name: "HDB Purchase",
    tag: "HDB Flat",
    theme: "sky",
    type: "HDB",
    price: "$1,999",
    description:
      "Full guidance through grants, financing and the resale process for your next flat.",
    learnMoreHref: "/buy-hdb",
    buttonText: "WhatsApp Us",
    includes: [
      "Affordability & grant planning",
      "Financing guidance",
      "Resale procedure support",
      "Negotiation & OTP",
    ],
  },
  {
    name: "Condo/Landed Purchase",
    tag: "Condo / Landed",
    theme: "indigo",
    type: "CondoLanded",
    price: BUY_NO_FEE_LABEL,
    description:
      "Market insights, project comparisons and negotiation support for resale condo and landed homes, at no cost to you.",
    learnMoreHref: "/buy-condo-landed",
    buttonText: "WhatsApp Us",
    includes: [
      "Market & project comparisons",
      "Unbiased shortlisting",
      "Viewing coordination",
      "Negotiation support",
    ],
  },
  {
    name: "New Launch Purchase",
    tag: "New Launch",
    theme: "amber",
    type: "NewLaunch",
    price: BUY_NO_FEE_LABEL,
    description:
      "We assist you to purchase New Launch straight from developers. Buyer pays no commission.",
    learnMoreHref: "/buy-new-launch",
    buttonText: "WhatsApp Us",
    includes: [
      "Unbiased project analysis",
      "Unit selection guidance",
      "Developer liaison support",
      "Documentation & handover",
    ],
  },
];

export const BUY_MAX_BY_TYPE: Record<BuyPropertyType, number> = {
  HDB: 2_000_000,
  CondoLanded: 6_000_000,
  NewLaunch: 6_000_000,
};

export const BUY_TYPE_LABELS: Record<BuyPropertyType, string> = {
  HDB: "HDB",
  CondoLanded: "Condo/Landed",
  NewLaunch: "New Launch",
};

export const BUY_THEME_STYLES: Record<BuyTheme, PropertyTypeStyle> = {
  sky: getPropertyTypeStyle("HDB"),
  indigo: getPropertyTypeStyle("Condo"),
  amber: getPropertyTypeStyle("Landed"),
};
