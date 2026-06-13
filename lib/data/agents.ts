export interface AgentVideo {
  id: string;
  title: string;
  publishedAt?: string;
}

export interface Agent {
  slug: string;
  name: string;
  cea: string;
  bio: string;
  photo: string;
  /** Short pull-quote for the profile hero */
  quote?: string;
  /** Expanded about bullets — agent-specific, not site-wide copy */
  about: string[];
  specialties: string[];
  /** YouTube @handle without the @ prefix */
  youtubeChannelHandle?: string;
  /** Optional hard-coded channel ID — skips handle resolution */
  youtubeChannelId?: string;
  /** Curated videos when RSS fetch is unavailable */
  featuredVideos?: AgentVideo[];
}

export const AGENTS: Agent[] = [
  {
    slug: "dennis-lim",
    name: "Dennis Lim",
    cea: "R055990G",
    bio: "Straight-talking guidance shaped by real ownership and upgrade experience, including private and landed homes in Singapore.",
    photo: "/images/agent-dennis.png",
    quote:
      "Selling isn't just about listing — it's about planning your next move with clarity, so more of your equity stays with your family.",
    about: [
      "Experienced across HDB, condo, and landed sales and upgrades",
      "Known for direct, honest advice grounded in real ownership experience",
      "Leads coordinated sell-and-buy planning for upgrading families",
      "Regular contributor on HomeUP's property education content",
    ],
    specialties: ["HDB upgrades", "Landed sales", "Sell-and-buy planning"],
    youtubeChannelHandle: "homeupdennis",
  },
  {
    slug: "yeo-tong-boon",
    name: "Yeo Tong Boon",
    cea: "R069651E",
    bio: "Passionate about helping homeowners plan their next move with clarity, structure, and confidence.",
    photo: "/images/agent-tong-boon.png",
    quote:
      "The best buying decisions come from understanding your options first — not rushing into the next viewing.",
    about: [
      "Senior advisor on HomeUP's buying team",
      "Supports buyers through financing, shortlisting, and negotiation",
      "Experienced with HDB, resale condo, and new launch purchases",
      "Focused on structured planning rather than transactional pressure",
    ],
    specialties: ["Buyer representation", "New launch", "Upgrader planning"],
    featuredVideos: [],
  },
  {
    slug: "edmund-lee",
    name: "Edmund Lee",
    cea: "R023385H",
    bio: "A steady hand with three decades of experience guiding HDB homeowners through resale decisions calmly and methodically.",
    photo: "/images/agent-edmund.png",
    quote:
      "HDB resale has a rhythm to it — when you understand the timeline, decisions become much calmer.",
    about: [
      "Three decades of experience in Singapore property",
      "Specialises in HDB resale and long-tenure owner transitions",
      "Methodical approach to pricing, timing, and documentation",
      "Trusted by homeowners who value patience over pressure",
    ],
    specialties: ["HDB resale", "Senior owners", "Resale documentation"],
  },
  {
    slug: "kenji-ching",
    name: "Kenji Ching",
    cea: "R070948I",
    bio: "Patient, practical support for homeowners navigating resale or their first upgrade.",
    photo: "/images/agent-kenji.png",
    quote:
      "First-time sellers often just need someone to explain the process clearly — that's where good advice starts.",
    about: [
      "Supports first-time sellers and upgraders through resale",
      "Known for responsive follow-through on viewings and offers",
      "Experienced across HDB and private property transactions",
      "Patient, practical guidance from listing through completion",
    ],
    specialties: ["First-time sellers", "HDB resale", "Viewing coordination"],
  },
  {
    slug: "olivia-neo",
    name: "Olivia Neo",
    cea: "R072836A",
    bio: "A friendly law diploma graduate, dedicated to guiding buyers and sellers on a smooth and transparent property journey.",
    photo: "/images/agent-olivia.png",
    quote:
      "Transparency matters on both sides of a transaction — buyers and sellers should always know what happens next.",
    about: [
      "Law diploma graduate with a focus on clear documentation",
      "Guides buyers and sellers through OTP and completion paperwork",
      "Brings a calm, friendly approach to complex transactions",
      "Dedicated to keeping clients informed at every step",
    ],
    specialties: ["Documentation", "Buyer support", "Transaction coordination"],
  },
  {
    slug: "isaac-tay",
    name: "Isaac Tay",
    cea: "R068575G",
    bio: "Dedicated to exceptional service, honest advice, and maximum value through HOMEUP's transparent fixed fee approach.",
    photo: "/images/agent-isaac.png",
    quote:
      "Believes in delivering exceptional service, honest advice and maximum value through our transparent fixed fee approach.",
    about: [
      "Focused on honest, client-first advice at every stage of a transaction",
      "Champions HOMEUP's transparent fixed fee model for maximum seller value",
      "Experienced across HDB and private property sales and purchases",
      "Committed to responsive follow-through from listing through completion",
    ],
    specialties: ["Fixed-fee sales", "Honest advisory", "HDB & private property"],
  },
];

export function getAgentBySlug(slug: string): Agent | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

export function getAllAgentSlugs(): string[] {
  return AGENTS.map((a) => a.slug);
}
