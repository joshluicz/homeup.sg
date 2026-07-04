import type { SellPropertyType } from "@/lib/data/sell-pricing";

export interface SellPageHero {
  title: string;
  highlight: string;
  subtitle: string;
  body: string;
  bodyDisclaimer?: string;
  ctaNote: string;
}

export interface SellPageConfig {
  slug: string;
  canonicalPath: string;
  filterType: SellPropertyType | null;
  defaultSliderType: SellPropertyType;
  hero: SellPageHero;
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
    body: "Most Singapore homeowners give away $10,000 to $70,000 in commission. HomeUP charges a fixed fee for the same full service, whether you're selling an HDB, condo, or landed home.",
    ctaNote: sharedProcessNote.ctaNote,
  },
  meta: {
    title: "Sell Your Property in Singapore",
    description:
      "Sell your HDB, condo or landed home with HomeUP. Fixed fees from $1,999. Full marketing, viewings and documentation. 1,000+ transactions closed.",
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
    body: "Sell your HDB at fixed fee $1999 + GST without compromising on service. Our full agent services include marketing, documentation (e.g. OTP), HDB submission and guidance till completion.",
    ctaNote: sharedProcessNote.ctaNote,
  },
  meta: {
    title: "Sell Your HDB Flat in Singapore",
    description:
      "Sell your HDB flat with HomeUP for a fixed $1,999 + GST. Full resale support: marketing, viewings, negotiation, and HDB submission. Save thousands vs typical 2% commission.",
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
    body: "Sell your Condo at fixed fee $4999* + GST. Our full agent services include marketing, documentation (e.g. OTP) and guidance till completion.",
    bodyDisclaimer:
      "*Additional 0.5% (sale price) applies if buyer has a co-broke agent.",
    ctaNote: sharedProcessNote.ctaNote,
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
    body: "Landed properties deserve the same structured approach at a fee that makes sense. HomeUP charges a fixed $9,999 + GST, not a percentage that scales with your home's value.",
    ctaNote: sharedProcessNote.ctaNote,
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
