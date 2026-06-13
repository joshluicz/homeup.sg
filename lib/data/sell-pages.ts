import type { SellPropertyType } from "@/lib/data/sell-pricing";

export interface SellPageHero {
  title: string;
  highlight: string;
  subtitle: string;
  body: string;
  ctaNote: string;
}

export interface SellTypeGuideContent {
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
}

export interface SellPageConfig {
  slug: string;
  canonicalPath: string;
  filterType: SellPropertyType | null;
  defaultSliderType: SellPropertyType;
  hero: SellPageHero;
  typeGuide: SellTypeGuideContent | null;
  meta: {
    title: string;
    description: string;
  };
}

const sharedProcessNote = {
  ctaNote: "No commitment · Free 30-min planning session",
  subtitle: "Fixed Fee Agents | Dedicated to Families",
};

export const SELL_PAGE_GENERAL: SellPageConfig = {
  slug: "sell",
  canonicalPath: "/sell",
  filterType: null,
  defaultSliderType: "HDB",
  hero: {
    title: "Sell Your Home for More.",
    highlight: "Save on Commissions.",
    subtitle: sharedProcessNote.subtitle,
    body: "Most Singapore homeowners give away $10,000–$70,000 in commission. HomeUP charges a fixed fee for the same full service — whether you're selling an HDB, condo, or landed home.",
    ctaNote: sharedProcessNote.ctaNote,
  },
  typeGuide: null,
  meta: {
    title: "Sell Your Property in Singapore",
    description:
      "Sell your HDB, condo, or landed home with HomeUP's transparent fixed fees — from $1,999. Full-service listing, marketing, viewings, and documentation. 1,000+ transactions closed.",
  },
};

export const SELL_PAGE_HDB: SellPageConfig = {
  slug: "sell-hdb",
  canonicalPath: "/sell-hdb",
  filterType: "HDB",
  defaultSliderType: "HDB",
  hero: {
    title: "Sell Your HDB Flat.",
    highlight: "Keep More of Your Proceeds.",
    subtitle: sharedProcessNote.subtitle,
    body: "HDB resale comes with its own timeline — MOP, valuation, and HDB submission. HomeUP handles it all at a fixed $1,999 + GST, not a percentage of your sale price.",
    ctaNote: sharedProcessNote.ctaNote,
  },
  typeGuide: {
    eyebrow: "Selling HDB",
    title: "Selling an HDB flat comes with its own timeline — we plan around it.",
    lead: "From eligibility checks to HDB submission, every step is structured so you know what happens next.",
    points: [
      "MOP and eligibility review before you commit to a sale timeline",
      "Valuation guidance aligned with recent transacted prices in your block and town",
      "Coordinated marketing across PropertyGuru, SRX, 99.co and social channels",
      "Full HDB resale documentation and submission handled by your dedicated agent",
    ],
  },
  meta: {
    title: "Sell Your HDB Flat in Singapore",
    description:
      "Sell your HDB flat with HomeUP for a fixed $1,999 + GST. Full resale support — marketing, viewings, negotiation, and HDB submission. Save thousands vs typical 2% commission.",
  },
};

export const SELL_PAGE_CONDO: SellPageConfig = {
  slug: "sell-condo",
  canonicalPath: "/sell-condo",
  filterType: "Condo",
  defaultSliderType: "Condo",
  hero: {
    title: "Sell Your Condo or EC.",
    highlight: "Fixed Fee. Full Service.",
    subtitle: sharedProcessNote.subtitle,
    body: "Resale condo sales need visibility and pricing discipline — not guesswork. HomeUP charges a fixed $4,999 + GST for the same full-service experience typical agents charge 2% for.",
    ctaNote: sharedProcessNote.ctaNote,
  },
  typeGuide: {
    eyebrow: "Selling Condo / EC",
    title: "Resale condo sales need visibility and pricing discipline — not guesswork.",
    lead: "Your home is marketed broadly, reviewed regularly, and managed with structured follow-through.",
    points: [
      "Multi-platform listing across major property portals and social channels",
      "Regular market feedback reviews — not a 'list and hope' approach",
      "Flexible viewing arrangements to maximise buyer interest through the week",
      "Contract drafting, negotiation, and completion handled end-to-end",
    ],
  },
  meta: {
    title: "Sell Your Condo or EC in Singapore",
    description:
      "Sell your condo or EC with HomeUP for a fixed $4,999 + GST. Full marketing, viewings, negotiation, and documentation. Save vs typical 2% agent commission.",
  },
};

export const SELL_PAGE_LANDED: SellPageConfig = {
  slug: "sell-landed",
  canonicalPath: "/sell-landed",
  filterType: "Landed",
  defaultSliderType: "Landed",
  hero: {
    title: "Sell Your Landed Home.",
    highlight: "A Fee That Makes Sense.",
    subtitle: sharedProcessNote.subtitle,
    body: "Landed properties deserve the same structured approach — at a fee that makes sense. HomeUP charges a fixed $9,999 + GST, not a percentage that scales with your home's value.",
    ctaNote: sharedProcessNote.ctaNote,
  },
  typeGuide: {
    eyebrow: "Selling Landed",
    title: "Landed properties deserve the same structured approach — at a fee that makes sense.",
    lead: "Tenure checks, buyer qualification, and patient negotiation — handled with the same commitment as every HomeUP listing.",
    points: [
      "Tenure and zoning checks before listing to avoid surprises later",
      "Targeted marketing to reach serious landed buyers, not casual browsers",
      "Structured viewing coordination and offer assessment with clear net proceeds",
      "Full contract drafting, negotiation, and completion support",
    ],
  },
  meta: {
    title: "Sell Your Landed Property in Singapore",
    description:
      "Sell your landed home with HomeUP for a fixed $9,999 + GST. Full-service marketing, viewings, negotiation, and documentation. Save vs typical 2% commission on high-value sales.",
  },
};

export const SELL_PAGES: Record<string, SellPageConfig> = {
  general: SELL_PAGE_GENERAL,
  hdb: SELL_PAGE_HDB,
  condo: SELL_PAGE_CONDO,
  landed: SELL_PAGE_LANDED,
};
