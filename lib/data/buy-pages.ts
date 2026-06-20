import type { BuyPropertyType } from "@/lib/data/buy-pricing";

export interface BuyPageHero {
  title: string;
  highlight: string;
  subtitle?: string;
  body?: string;
  points: string[];
  ctaNote: string;
}

export interface BuyTypeGuideContent {
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
}

export interface BuyPageConfig {
  slug: string;
  canonicalPath: string;
  filterType: BuyPropertyType | null;
  defaultSliderType: BuyPropertyType;
  hero: BuyPageHero;
  typeGuide: BuyTypeGuideContent | null;
  meta: {
    title: string;
    description: string;
  };
}

export const BUY_PAGE_GENERAL: BuyPageConfig = {
  slug: "buy",
  canonicalPath: "/buy",
  filterType: null,
  defaultSliderType: "HDB",
  hero: {
    title: "Buy with a clear plan.",
    highlight: "Not guesswork.",
    subtitle: "A coordinated buying team, not a solo agent.",
    body: "From your first HDB to a condo upgrade or new launch, HomeUP guides every stage: financing, shortlisting, negotiation and timing your next move, so you buy with confidence.",
    points: [
      "Affordability, grants and financing guidance",
      "HDB, resale condo/landed and new launch comparisons",
      "Negotiation and sell-and-buy coordination",
    ],
    ctaNote: "No commitment · Build a clear roadmap for your next move",
  },
  typeGuide: null,
  meta: {
    title: "Buy Property in Singapore",
    description:
      "Buy your next Singapore home with HomeUP. Complimentary representation for condo, landed, and new launch purchases. HDB buying from $1,999. Expert financing, negotiation, and sell-and-buy planning.",
  },
};

export const BUY_PAGE_HDB: BuyPageConfig = {
  slug: "buy-hdb",
  canonicalPath: "/buy-hdb",
  filterType: "HDB",
  defaultSliderType: "HDB",
  hero: {
    title: "Buy Your Next HDB Flat.",
    highlight: "With a Clear Plan.",
    subtitle: "Structured guidance from grants to OTP.",
    body: "HomeUP guides you at a transparent fixed fee of $1999 + GST",
    points: [
      "Central Provident Fund (CPF) grant and affordability planning before you shortlist",
      "Financing guidance aligned with your sale and purchase timeline",
      "Resale procedure support from viewing to Option to Purchase (OTP) signing",
    ],
    ctaNote: "No commitment · Understand your options before you commit",
  },
  typeGuide: {
    eyebrow: "Buying HDB",
    title: "HDB resale has more moving parts than most buyers expect. We map them out first.",
    lead: "Grants, loan eligibility, and sale-purchase timing are planned upfront so you buy with clarity.",
    points: [
      "Grant eligibility and affordability review before shortlisting",
      "Unit comparison across towns, blocks, and floor levels",
      "Coordinated viewings and structured offer negotiation",
      "Full Option to Purchase (OTP) and resale documentation support through completion",
    ],
  },
  meta: {
    title: "Buy an HDB Flat in Singapore",
    description:
      "Buy your next HDB flat with HomeUP for a fixed $1,999 + GST. Grant planning, financing guidance, shortlisting, negotiation, and Option to Purchase (OTP) support from a coordinated buying team.",
  },
};

export const BUY_PAGE_CONDO_LANDED: BuyPageConfig = {
  slug: "buy-condo-landed",
  canonicalPath: "/buy-condo-landed",
  filterType: "CondoLanded",
  defaultSliderType: "CondoLanded",
  hero: {
    title: "Buy Condo or Landed.",
    highlight: "No Agent Fees",
    points: [
      "Unbiased market and project comparisons",
      "Viewing coordination and offer negotiation",
      "Sell-and-buy timing planned alongside your sale",
    ],
    ctaNote: "No commitment · No Fees buyer representation",
  },
  typeGuide: {
    eyebrow: "Buying Condo / Landed",
    title: "Resale private property needs unbiased guidance, not sales-driven pressure.",
    lead: "We shortlist, compare, and negotiate with your interests first, because our fee isn't tied to the purchase price.",
    points: [
      "Market analysis and project comparisons tailored to your budget",
      "Tenure, location, and resale potential reviewed before you view",
      "Structured viewing coordination and offer assessment",
      "Negotiation and documentation handled through to completion",
    ],
  },
  meta: {
    title: "Buy Condo or Landed Property in Singapore",
    description:
      "Buy a resale condo or landed home with complimentary HomeUP buyer representation. Market analysis, shortlisting, negotiation, and documentation at no cost to you.",
  },
};

export const BUY_PAGE_NEW_LAUNCH: BuyPageConfig = {
  slug: "buy-new-launch",
  canonicalPath: "/buy-new-launch",
  filterType: "NewLaunch",
  defaultSliderType: "NewLaunch",
  hero: {
    title: "Buy a New Launch.",
    highlight: "No Agent Fees",
    subtitle: "Straight from developers, with unbiased guidance.",
    points: [
      "Unbiased project and floor plan analysis",
      "Unit selection guidance aligned with your budget and goals",
      "Developer liaison and documentation through to handover",
    ],
    ctaNote: "No commitment · Explore new launch options with clarity",
  },
  typeGuide: {
    eyebrow: "Buying New Launch",
    title: "New launch purchases need clear analysis, not showroom pressure.",
    lead: "We help you compare projects, select the right unit, and navigate the purchase process with neutral advice.",
    points: [
      "Project comparison across location, pricing, and developer track record",
      "Floor plan and stack analysis for light, noise, and resale potential",
      "Balloting, option, and purchase timeline managed step by step",
      "Documentation and handover coordination through to keys",
    ],
  },
  meta: {
    title: "Buy New Launch Property in Singapore",
    description:
      "Purchase a new launch property with HomeUP. Buyer pays no commission. Unbiased project analysis, unit selection, and developer liaison. Complimentary buyer representation.",
  },
};

export const BUY_PAGES: Record<string, BuyPageConfig> = {
  general: BUY_PAGE_GENERAL,
  hdb: BUY_PAGE_HDB,
  "condo-landed": BUY_PAGE_CONDO_LANDED,
  "new-launch": BUY_PAGE_NEW_LAUNCH,
};
