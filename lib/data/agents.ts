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
  /** Role shown on the agent profile page (e.g. Co-Founder, Partner) */
  profileTitle?: string;
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
    profileTitle: "Co-Founder",
    cea: "R055990G",
    bio: "Straight-talking guidance shaped by real ownership and upgrade experience, including private and landed homes in Singapore.",
    photo: "/images/agent-dennis.png",
    quote:
      "Dennis brings extensive experience across Singapore's property market, with 5 private property investments including a landed home in Singapore held under trust and 3 properties in China.",
    quoteThirdPerson: true,
    accolades: [
      "NUS BBA (Hons)",
      "ABF Award (Ministry of Trade & Industry)",
      "Top Sale (Residential) 2025",
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
    introYoutubeVideoId: "6uAbIF5tVKY",
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
    profileTitle: "Co-Founder",
    cea: "R069651E",
    bio: "Having completed hundreds of property transactions across Singapore, Tong Boon has helped hundreds of families successfully upgrade and acquire their next home.",
    photo: "/images/agent-tong-boon.png",
    quote:
      "Having completed hundreds of property transactions across Singapore, Tong Boon has helped hundreds of families successfully upgrade and acquire their next home. His market insights and transaction experience have led to invitations from CNA and features on 99.co, where he shares commentary on Singapore's residential property market as a subject matter expert.",
    quoteThirdPerson: true,
    accolades: [
      "NUS Real Estate (Hons)",
      "Top Private Property Buying Transactor | C&H 2025",
      "Top Agent Under 40 & Top 3 Producer | C&H 2025",
      "Centurion Award 2025",
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
    introYoutubeVideoId: "esxB41Md9kc",
    featuredTikTokVideos: [
      {
        id: "7631845291800481032",
        url: "https://www.tiktok.com/@homeup_tongboon/video/7631845291800481032",
      },
      {
        id: "7620785028812836103",
        url: "https://www.tiktok.com/@homeup_tongboon/video/7620785028812836103",
      },
      {
        id: "7642310615293316370",
        url: "https://www.tiktok.com/@homeup_tongboon/video/7642310615293316370",
      },
    ],
  },
  {
    slug: "edmund-lee",
    name: "Edmund Lee",
    profileTitle: "Partner",
    cea: "R023385H",
    bio: "A steady hand with three decades of experience guiding HDB homeowners through resale decisions calmly and methodically.",
    photo: "/images/agent-edmund.png",
    quote:
      "Edmund Lee is a steady hand with three decades of experience guiding HDB homeowners through resale decisions calmly and methodically. He specialises in HDB resale and long-tenure owner transitions, with a trusted, patient approach to pricing, timing, and documentation.",
    quoteThirdPerson: true,
    about: [],
    specialties: ["HDB resale", "Senior owners", "Resale documentation"],
    social: {
      instagram: "https://www.instagram.com/edmundleesw?igsh=MXQyaWNkdDY4dTZmZg==",
      youtube: "https://www.youtube.com/@edmundlee9189",
      facebook: "https://facebook.com/edmund.lee.55",
      tiktok: "https://www.tiktok.com/@edmundleesiewwah?_r=1&_t=ZS-97B51ZndzSX",
    },
    youtubeChannelHandle: "edmundlee9189",
    introYoutubeVideoId: "HijepXyK4U0",
    featuredTikTokVideos: [
      {
        id: "7649749005693406482",
        url: "https://www.tiktok.com/@edmundleesiewwah/video/7649749005693406482",
      },
      {
        id: "7639603282712792328",
        url: "https://www.tiktok.com/@edmundleesiewwah/video/7639603282712792328",
      },
      {
        id: "7651599442377706760",
        url: "https://www.tiktok.com/@edmundleesiewwah/video/7651599442377706760",
      },
    ],
  },
  {
    slug: "kenji-ching",
    name: "Kenji Ching",
    profileTitle: "Partner",
    cea: "R070948I",
    bio: "Patient, practical support for homeowners navigating resale or their first upgrade.",
    photo: "/images/agent-kenji.png",
    quote:
      "Kenji Ching provides patient, practical support for homeowners navigating resale or their first upgrade. He is known for responsive follow-through on viewings and offers, with experience across HDB and private property transactions from listing through completion.",
    quoteThirdPerson: true,
    about: [],
    specialties: ["First-time sellers", "HDB resale", "Viewing coordination"],
    social: {
      instagram: "https://www.instagram.com/homeup_kenji?igsh=MW8wbTI1em05c253dQ==",
      youtube: "https://youtube.com/@homeup_kenji?si=eXa0m8tdnGrH-W7G",
      facebook: "https://www.facebook.com/share/1GtmXmPGDT/?mibextid=wwXIfr",
      tiktok: "https://www.tiktok.com/@homeup_kenji?_r=1&_t=ZS-97B4xfP5Hme",
    },
    youtubeChannelHandle: "homeup_kenji",
    introYoutubeVideoId: "_ufdxj3qftc",
    featuredTikTokVideos: [
      {
        id: "7625629127298616594",
        url: "https://www.tiktok.com/@homeup_kenji/video/7625629127298616594",
      },
      {
        id: "7634066326482341128",
        url: "https://www.tiktok.com/@homeup_kenji/video/7634066326482341128",
      },
      {
        id: "7593327782197759240",
        url: "https://www.tiktok.com/@homeup_kenji/video/7593327782197759240",
      },
    ],
  },
  {
    slug: "olivia-neo",
    name: "Olivia Neo",
    cea: "R072836A",
    bio: "Friendly, approachable guidance for HDB and private property sales and purchases, with honest advice from start to finish.",
    photo: "/images/agent-olivia.png",
    quote:
      "With a friendly and approachable nature, and experience in both HDB and private property sales and purchases, Olivia is committed to guiding buyers and sellers through every stage of their property journey. She believes in honest advice, prompt communication, and dedicated support to ensure a smooth experience from start to finish.",
    quoteThirdPerson: true,
    accolades: ["TP Law Diploma"],
    about: [],
    specialties: ["Documentation", "Buyer support", "Transaction coordination"],
    social: {
      instagram: "https://www.instagram.com/homeup_olivia?igsh=bWZ6OGx1MGE0OGk0",
      youtube: "https://youtube.com/@homeupolivia?si=F2FV-VZvBRmaAnXe",
      facebook: "https://www.facebook.com/share/1DmWFr81pr/?mibextid=wwXIfr",
      tiktok: "https://www.tiktok.com/@homeup_olivia?_r=1&_t=ZS-97B4y7SmVLZ",
    },
    youtubeChannelHandle: "homeupolivia",
    introYoutubeVideoId: "O-t1i4W_an4",
    featuredTikTokVideos: [
      {
        id: "7647084977745612039",
        url: "https://www.tiktok.com/@homeup_olivia/video/7647084977745612039",
      },
      {
        id: "7637547101282389256",
        url: "https://www.tiktok.com/@homeup_olivia/video/7637547101282389256",
      },
      {
        id: "7638154827150757138",
        url: "https://www.tiktok.com/@homeup_olivia/video/7638154827150757138",
      },
    ],
  },
  {
    slug: "isaac-tay",
    name: "Isaac Tay",
    cea: "R068575G",
    bio: "Dedicated to exceptional service, honest advice, and maximum value through HOMEUP's transparent fixed fee approach.",
    photo: "/images/agent-isaac.png",
    quote:
      "Isaac Tay is dedicated to exceptional service, honest advice, and maximum value through HOMEUP's transparent fixed fee approach. He champions client-first advice at every stage, with experience across HDB and private property sales and purchases and responsive follow-through from listing through completion.",
    quoteThirdPerson: true,
    about: [],
    specialties: ["Fixed-fee sales", "Honest advisory", "HDB & private property"],
    social: {
      instagram: "https://www.instagram.com/homeup_isaac?igsh=MWZwOXJsc2o1d3dleA==",
      youtube: "https://youtube.com/@homeup_isaac?si=jzrsjTdhT_c8uMzo",
      facebook: "https://www.facebook.com/share/192khvLkLn/?mibextid=wwXIfr",
      tiktok: "https://www.tiktok.com/@homeupisaac?_r=1&_t=ZS-97B4wwo3mKr",
    },
    youtubeChannelHandle: "homeup_isaac",
    introYoutubeVideoId: "HSgarssnd7Y",
  },
];

export function getAgentBySlug(slug: string): Agent | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

export function getAllAgentSlugs(): string[] {
  return AGENTS.map((a) => a.slug);
}
