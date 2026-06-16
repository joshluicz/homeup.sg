// ─────────────────────────────────────────────────────────────────────────────
// PLAYBOOK DATA LAYER
//
// This file is the single source of truth for all Playbook videos.
//
// BACKEND INTEGRATION:
//   When you're ready to connect a CMS or API, replace the `PLAYBOOK_VIDEOS`
//   array export with an async fetch function, e.g.:
//
//     export async function getPlaybookVideos(): Promise<PlaybookVideo[]> {
//       const res = await fetch("https://your-api.com/playbook/videos", {
//         next: { revalidate: 3600 }, // ISR — revalidate every hour
//       });
//       return res.json();
//     }
//
//   Then update PlaybookLibrary.tsx to receive videos as props from the
//   server component in app/playbook/page.tsx.
// ─────────────────────────────────────────────────────────────────────────────

import type { FlatType, ListedAs } from "@/lib/listings/types";

export type VideoCategory =
  | "all"
  | "selling"
  | "buying"
  | "process"
  | "market"
  | "tips";

export interface FaqEntry {
  q: string;
  a: string;
}

export interface PlaybookVideo {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Exclude<VideoCategory, "all">;
  duration: string;     // "mm:ss"
  thumbnail: string;    // absolute image URL
  videoUrl: string;     // YouTube / Vimeo URL — empty string if not yet published
  featured?: boolean;
  publishedAt: string;  // ISO date string "YYYY-MM-DD"
  tags: string[];
  article?: string;          // Markdown article body shown on /playbook/[slug]
  faq?: FaqEntry[];          // Q&A pairs rendered as FAQ + FAQPage schema
  metaDescription?: string;  // SEO meta description for the article page
}

export const CATEGORY_LABELS: Record<VideoCategory, string> = {
  all:     "All Videos",
  selling: "Selling",
  buying:  "Buying",
  process: "Our Process",
  market:  "Market Insights",
  tips:    "Property Tips",
};

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO LIBRARY
// Replace this array with getPlaybookVideos() when backend is ready.
// ─────────────────────────────────────────────────────────────────────────────
export const PLAYBOOK_VIDEOS: PlaybookVideo[] = [
  {
    id: "1",
    slug: "homeup-fixed-fee-advantage",
    title: "The Fixed-Fee Advantage: How We Save You Thousands",
    description:
      "Understand exactly how HomeUP's transparent flat fee compares to a traditional 2% agent commission, and what that means for your pocket on a typical Singapore sale.",
    category: "selling",
    duration: "4:15",
    thumbnail:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    videoUrl: "",
    featured: true,
    publishedAt: "2025-01-15",
    tags: ["fixed fee", "commission", "savings"],
  },
  {
    id: "2",
    slug: "hdb-selling-process-explained",
    title: "HDB Selling Process Explained: Step by Step",
    description:
      "From the first valuation call to collecting the keys at HDB Hub, we walk you through every milestone so there are no surprises on your selling journey.",
    category: "process",
    duration: "6:42",
    thumbnail:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    videoUrl: "",
    featured: true,
    publishedAt: "2025-02-01",
    tags: ["HDB", "selling", "process", "step-by-step"],
  },
  {
    id: "3",
    slug: "condo-selling-what-to-expect",
    title: "Selling Your Condo: What to Expect",
    description:
      "Condo sales involve different timelines and documents compared to HDB. This video covers the unique steps, from OTP to legal completion, for private property sellers.",
    category: "selling",
    duration: "5:30",
    thumbnail:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    videoUrl: "",
    publishedAt: "2025-02-14",
    tags: ["condo", "selling", "OTP", "private property"],
  },
  {
    id: "4",
    slug: "staging-home-quick-sale",
    title: "How to Stage Your Home for a Quick, High-Value Sale",
    description:
      "Small changes in presentation can significantly impact buyer perception and final price. Our agents share practical staging tips that cost little but yield outsized results.",
    category: "tips",
    duration: "3:55",
    thumbnail:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
    videoUrl: "",
    publishedAt: "2025-03-01",
    tags: ["staging", "tips", "presentation"],
  },
  {
    id: "5",
    slug: "buying-hdb-resale-guide",
    title: "Buying a Resale HDB: Your Complete Guide",
    description:
      "Eligibility checks, COV negotiations, the HFE letter, and what happens on completion day. Everything a first-time HDB buyer needs to know before signing anything.",
    category: "buying",
    duration: "7:20",
    thumbnail:
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80",
    videoUrl: "",
    publishedAt: "2025-03-15",
    tags: ["buying", "HDB", "resale", "first-timer"],
  },
  {
    id: "6",
    slug: "singapore-property-market-2025",
    title: "Singapore Property Market Outlook 2025",
    description:
      "Price trends, HDB resale volume, cooling measures, and what they mean if you're planning to sell or upgrade this year. Data-driven insights from the HomeUP team.",
    category: "market",
    duration: "8:10",
    thumbnail:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    videoUrl: "",
    featured: true,
    publishedAt: "2025-01-05",
    tags: ["market", "2025", "trends", "cooling measures"],
  },
  {
    id: "7",
    slug: "otp-process-singapore",
    title: "Understanding the OTP: A Seller's Guide",
    description:
      "The Option to Purchase is the most critical document in any Singapore property transaction. Learn what to look for, common clauses, and red flags to avoid.",
    category: "process",
    duration: "5:05",
    thumbnail:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    videoUrl: "",
    publishedAt: "2025-04-01",
    tags: ["OTP", "legal", "process", "documents"],
  },
  {
    id: "8",
    slug: "sell-and-buy-simultaneously",
    title: "How to Sell and Buy at the Same Time Without the Stress",
    description:
      "Timing a sale and purchase together is Singapore's most common, and often most stressful, property move. We explain how to synchronise both transactions and protect your interests.",
    category: "process",
    duration: "6:00",
    thumbnail:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
    videoUrl: "",
    publishedAt: "2025-04-15",
    tags: ["sell and buy", "upgrade", "timing", "HDB"],
  },
  {
    id: "9",
    slug: "common-seller-mistakes",
    title: "5 Mistakes Sellers Make (And How to Avoid Them)",
    description:
      "Overpricing, under-preparing, picking the wrong agent. These are the five most common errors our agents see every week. Watch this before you list.",
    category: "tips",
    duration: "4:45",
    thumbnail:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    videoUrl: "",
    publishedAt: "2025-05-01",
    tags: ["mistakes", "tips", "sellers", "pricing"],
  },
  {
    id: "10",
    slug: "complimentary-condo-buyer-rep",
    title: "Why Condo Buyer Representation Is Complimentary at HomeUP",
    description:
      "Buying a resale condo? Our buyer representation service costs you nothing. We explain the fee structure, who actually pays, and what you get for free.",
    category: "buying",
    duration: "3:30",
    thumbnail:
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80",
    videoUrl: "",
    publishedAt: "2025-05-15",
    tags: ["buying", "condo", "complimentary", "buyer rep"],
  },
  {
    id: "11",
    slug: "valuation-vs-asking-price",
    title: "Valuation vs Asking Price: Setting the Right Number",
    description:
      "Many sellers confuse a bank valuation with the right asking price. This video explains how to set a competitive price that attracts buyers while maximising your return.",
    category: "tips",
    duration: "4:00",
    thumbnail:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    videoUrl: "",
    publishedAt: "2025-06-01",
    tags: ["valuation", "pricing", "strategy"],
  },
  {
    id: "12",
    slug: "meet-the-homeup-team",
    title: "Meet the HomeUP Team",
    description:
      "Five CEA-licensed property agents, 1,000+ transactions closed, and a shared mission to make property sales fairer in Singapore. Get to know the people behind HomeUP.",
    category: "process",
    duration: "2:50",
    thumbnail:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
    videoUrl: "",
    featured: true,
    publishedAt: "2024-12-01",
    tags: ["team", "about", "agents", "HomeUP"],
  },
];

const FLAT_TYPE_TAG_HINTS: Record<FlatType, string[]> = {
  hdb: ["hdb"],
  condominium: ["condo", "private property"],
  apartment: ["condo", "private property", "apartment"],
  landed: ["landed"],
};

export function getRelatedPlaybookVideos(opts: {
  flat_type: FlatType;
  listed_as: ListedAs;
  limit?: number;
}): PlaybookVideo[] {
  const { flat_type, listed_as, limit = 3 } = opts;
  const tagHints = FLAT_TYPE_TAG_HINTS[flat_type];
  const preferredCategories =
    listed_as === "sell"
      ? new Set(["selling", "process", "tips"])
      : new Set(["buying", "tips", "process"]);

  const scored = PLAYBOOK_VIDEOS.map((video) => {
    let score = 0;
    if (preferredCategories.has(video.category)) score += 2;
    const tagsLower = video.tags.map((t) => t.toLowerCase());
    for (const hint of tagHints) {
      if (tagsLower.some((t) => t.includes(hint))) score += 3;
    }
    if (listed_as === "sell" && tagsLower.some((t) => t.includes("sell"))) score += 1;
    if (listed_as === "rent" && tagsLower.some((t) => t.includes("buy"))) score += 1;
    return { video, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ video }) => video);
}
