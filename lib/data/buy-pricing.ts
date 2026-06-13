export type BuyPropertyType = "HDB" | "CondoLanded" | "NewLaunch";

export type BuyTheme = "blue" | "green" | "amber";

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

export const BUY_PLANS: BuyPlan[] = [
  {
    name: "HDB Purchase",
    tag: "HDB Flat",
    theme: "blue",
    type: "HDB",
    price: "$1,999",
    description:
      "Full guidance through grants, financing and the resale process for your next flat.",
    learnMoreHref: "/buy-hdb",
    buttonText: "Connect with HOMEUP agent",
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
    theme: "green",
    type: "CondoLanded",
    price: "Complimentary",
    description:
      "Market insights, project comparisons and negotiation support for resale condo and landed homes, at no cost to you.",
    learnMoreHref: "/buy-condo-landed",
    buttonText: "Connect with HOMEUP agent",
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
    price: "Complimentary",
    description:
      "We assist you to purchase New Launch straight from developers. Buyer pays no commission.",
    learnMoreHref: "/buy-new-launch",
    buttonText: "Connect with HOMEUP agent",
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

export const BUY_THEME_STYLES = {
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
