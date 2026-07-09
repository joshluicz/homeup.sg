/**
 * HomeUp brand voice & identity config.
 * All pipeline modules pull from here — change once, propagates everywhere.
 */
export const BRAND = {
  name: "HomeUp",
  fullName: "HomeUp Singapore",
  tagline: "Singapore's fixed-fee property agency",
  fees: {
    hdb: "$1,999",
    condoEc: "$4,999",
    landed: "$9,999",
  },
  cta: {
    /** Base WhatsApp number — use trackedWhatsappUrl(slug) in article prompts */
    whatsapp: "https://wa.me/6580877015",
    sellHdb: "/sell-hdb",
    buyCondo: "/buy-condo",
    playbook: "/playbook",
  },
  voice: {
    tone: "direct, trustworthy, benefit-focused, plain English",
    persona:
      "A senior Singapore property agent who is analytical, honest about trade-offs, and never hypes the market. Speaks like an experienced friend, not a salesperson.",
    avoid: [
      "guaranteed returns",
      "prices only go up",
      "act now",
      "limited time",
      "never been a better time",
      "risk-free",
    ],
    prefer: [
      "short paragraphs — 2–4 sentences max",
      "answer the question first, explain after",
      "Singapore-specific terms: HDB, BTO, MOP, COV, ABSD, CPF OA, OTP, TDSR, MSR, EC, TOP",
      "cite URA, HDB, CPF Board rules (not invented figures)",
      "acknowledge uncertainty where it exists",
    ],
  },
  authors: [
    {
      slug: "yeo-tong-boon",
      name: "Yeo Tong Boon",
      title: "Co-Founder, HomeUp",
      expertise: ["hdb_upgrade", "upgraders", "condo_resale", "selling"],
    },
    {
      slug: "dennis-lim",
      name: "Dennis Lim",
      title: "Co-Founder, HomeUp",
      expertise: ["condo_new_launch", "landed", "investment", "buying_first"],
    },
    {
      slug: "olivia-neo",
      name: "Olivia Neo",
      title: "Property Agent, HomeUp",
      expertise: ["hdb_resale", "buying_first", "hdb_bto"],
    },
    {
      slug: "kenji-ching",
      name: "Kenji Ching",
      title: "Property Agent, HomeUp",
      expertise: ["condo_tips", "investment", "condo_resale"],
    },
    {
      slug: "isaac-tay",
      name: "Isaac Tay",
      title: "Property Agent, HomeUp",
      expertise: ["buying_first", "hdb_resale", "ec"],
    },
  ],
} as const;

export type BrandAuthor = (typeof BRAND.authors)[number];

/**
 * Returns a slug-tracked WhatsApp URL for use in article CTAs.
 * Routes through /go/whatsapp so each click is logged to lead_events.
 * Falls back to the bare wa.me link if no slug is provided.
 */
export function trackedWhatsappUrl(slug: string): string {
  if (!slug) return BRAND.cta.whatsapp;
  return `/go/whatsapp?slug=${encodeURIComponent(slug)}`;
}
