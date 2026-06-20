export interface AgentVideo {
  id: string;
  title: string;
  publishedAt?: string;
}

export interface AgentTikTokVideo {
  id: string;
  url: string;
}

export interface AgentSocialLinks {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
}

export interface Agent {
  slug: string;
  name: string;
  cea: string;
  bio: string;
  photo: string;
  /** Short pull-quote for the profile hero */
  quote?: string;
  /** When true, hero quote renders as third-person summary without quotation marks */
  quoteThirdPerson?: boolean;
  /** Expanded about bullets — agent-specific, not site-wide copy */
  about: string[];
  /** Awards, credentials, and recognition */
  accolades?: string[];
  specialties: string[];
  social?: AgentSocialLinks;
  /** YouTube @handle without the @ prefix */
  youtubeChannelHandle?: string;
  /** Optional hard-coded channel ID — skips handle resolution */
  youtubeChannelId?: string;
  /** Curated videos when RSS fetch is unavailable */
  featuredVideos?: AgentVideo[];
  /** Curated TikTok embeds for the agent profile page */
  featuredTikTokVideos?: AgentTikTokVideo[];
  /** Hero intro video on the agent profile page */
  introYoutubeVideoId?: string;
}

export const AGENTS: Agent[] = [
  {
    slug: "dennis-lim",
    name: "Dennis Lim",
    cea: "R055990G",
    bio: "Straight-talking guidance shaped by real ownership and upgrade experience, including private and landed homes in Singapore.",
    photo: "/images/agent-dennis.png",
    quote:
      "Dennis brings extensive experience across Singapore's property market, with 5 private property investments including a landed home in Singapore held under trust and 3 properties in China. His expertise spans property ownership, investment structures, and cross-border real estate.",
    quoteThirdPerson: true,
    accolades: [
      "NUS BBA (Hons)",
      "ABF Award (Ministry of Trade & Industry)",
      "Top Sale (Residential) I 2025",
      "Double Centurion Award 2025",
    ],
    about: [],
    specialties: ["HDB upgrades", "Landed sales", "Sell-and-buy planning"],
    social: {
      instagram: "https://www.instagram.com/homeup_dennis?igsh=MXhvY2drMTFqN2hoYQ==",
      youtube: "https://youtube.com/@homeupdennis?si=iPds4zsCVepIc0Lr",
      facebook: "https://www.facebook.com/share/1BxJ6MEvmH/?mibextid=wwXIfr",
      tiktok: "https://www.tiktok.com/@homeup_dennis?_r=1&_t=ZS-97B1n2NKNtM",
    },
    youtubeChannelHandle: "homeupdennis",
    introYoutubeVideoId: "pBcnhk05rJs",
    featuredTikTokVideos: [
      {
        id: "7638950012826799380",
        url: "https://www.tiktok.com/@homeup_dennis/video/7638950012826799380",
      },
      {
        id: "7631940560378465557",
        url: "https://www.tiktok.com/@homeup_dennis/video/7631940560378465557",
      },
      {
        id: "7638994457123360021",
        url: "https://www.tiktok.com/@homeup_dennis/video/7638994457123360021",
      },
    ],
  },
  {
    slug: "yeo-tong-boon",
    name: "Yeo Tong Boon",
    cea: "R069651E",
    bio: "Having completed hundreds of property transactions across Singapore, Tong Boon has helped hundreds of families successfully upgrade and acquire their next home.",
    photo: "/images/agent-tong-boon.png",
    quote:
      "Having completed hundreds of property transactions across Singapore, Tong Boon has helped hundreds of families successfully upgrade and acquire their next home. His market insights and transaction experience have led to invitations from CNA and features on 99.co, where he shares commentary on Singapore's residential property market as a subject matter expert.",
    quoteThirdPerson: true,
    accolades: [
      "CNA commentary on Singapore's residential property market",
      "Featured on 99.co as a subject matter expert",
    ],
    about: [],
    specialties: ["Buyer representation", "New launch", "Upgrader planning"],
    social: {
      instagram: "https://www.instagram.com/homeup_tongboon?igsh=azdldjc4NWNoZmUy",
      youtube: "https://youtube.com/@homeup_tongboon?si=CVzemx3d-Qco95Vm",
      facebook: "https://www.facebook.com/share/1DAfh57HRg/?mibextid=wwXIfr",
      tiktok: "https://www.tiktok.com/@homeup_tongboon?_r=1&_t=ZS-97B4uCSU72i",
    },
    youtubeChannelHandle: "homeup_tongboon",
  },
  {
    slug: "edmund-lee",
    name: "Edmund Lee",
    cea: "R023385H",
    bio: "A steady hand with three decades of experience guiding HDB homeowners through resale decisions calmly and methodically.",
    photo: "/images/agent-edmund.png",
    quote:
      "HDB resale has a rhythm to it. When you understand the timeline, decisions become much calmer.",
    about: [
      "Three decades of experience in Singapore property",
      "Specialises in HDB resale and long-tenure owner transitions",
      "Methodical approach to pricing, timing, and documentation",
      "Trusted by homeowners who value patience over pressure",
    ],
    specialties: ["HDB resale", "Senior owners", "Resale documentation"],
    social: {
      instagram: "https://www.instagram.com/edmundleesw?igsh=MXQyaWNkdDY4dTZmZg==",
      youtube: "https://www.youtube.com/@edmundlee9189",
      facebook: "https://facebook.com/edmund.lee.55",
      tiktok: "https://www.tiktok.com/@edmundleesiewwah?_r=1&_t=ZS-97B51ZndzSX",
    },
    youtubeChannelHandle: "edmundlee9189",
  },
  {
    slug: "kenji-ching",
    name: "Kenji Ching",
    cea: "R070948I",
    bio: "Patient, practical support for homeowners navigating resale or their first upgrade.",
    photo: "/images/agent-kenji.png",
    quote:
      "First-time sellers often just need someone to explain the process clearly. That's where good advice starts.",
    about: [
      "Supports first-time sellers and upgraders through resale",
      "Known for responsive follow-through on viewings and offers",
      "Experienced across HDB and private property transactions",
      "Patient, practical guidance from listing through completion",
    ],
    specialties: ["First-time sellers", "HDB resale", "Viewing coordination"],
    social: {
      instagram: "https://www.instagram.com/homeup_kenji?igsh=MW8wbTI1em05c253dQ==",
      youtube: "https://youtube.com/@homeup_kenji?si=eXa0m8tdnGrH-W7G",
      facebook: "https://www.facebook.com/share/1GtmXmPGDT/?mibextid=wwXIfr",
      tiktok: "https://www.tiktok.com/@homeup_kenji?_r=1&_t=ZS-97B4xfP5Hme",
    },
    youtubeChannelHandle: "homeup_kenji",
  },
  {
    slug: "olivia-neo",
    name: "Olivia Neo",
    cea: "R072836A",
    bio: "A friendly law diploma graduate, dedicated to guiding buyers and sellers on a smooth and transparent property journey.",
    photo: "/images/agent-olivia.png",
    quote:
      "Transparency matters on both sides of a transaction. Buyers and sellers should always know what happens next.",
    about: [
      "Law diploma graduate with a focus on clear documentation",
      "Guides buyers and sellers through Option to Purchase (OTP) and completion paperwork",
      "Brings a calm, friendly approach to complex transactions",
      "Dedicated to keeping clients informed at every step",
    ],
    specialties: ["Documentation", "Buyer support", "Transaction coordination"],
    social: {
      instagram: "https://www.instagram.com/homeup_olivia?igsh=bWZ6OGx1MGE0OGk0",
      youtube: "https://youtube.com/@homeupolivia?si=F2FV-VZvBRmaAnXe",
      facebook: "https://www.facebook.com/share/1DmWFr81pr/?mibextid=wwXIfr",
      tiktok: "https://www.tiktok.com/@homeup_olivia?_r=1&_t=ZS-97B4y7SmVLZ",
    },
    youtubeChannelHandle: "homeupolivia",
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
    social: {
      instagram: "https://www.instagram.com/homeup_isaac?igsh=MWZwOXJsc2o1d3dleA==",
      youtube: "https://youtube.com/@homeup_isaac?si=jzrsjTdhT_c8uMzo",
      facebook: "https://www.facebook.com/share/192khvLkLn/?mibextid=wwXIfr",
      tiktok: "https://www.tiktok.com/@homeupisaac?_r=1&_t=ZS-97B4wwo3mKr",
    },
    youtubeChannelHandle: "homeup_isaac",
  },
];

export function getAgentBySlug(slug: string): Agent | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

export function getAllAgentSlugs(): string[] {
  return AGENTS.map((a) => a.slug);
}
