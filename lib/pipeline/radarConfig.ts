/**
 * Topic radar configuration — curated Singapore property search intents.
 * Each topic carries category tags used for author routing and content scoring.
 */

export type TopicCategory =
  | "hdb_upgrade"
  | "hdb_resale"
  | "hdb_bto"
  | "condo_resale"
  | "condo_new_launch"
  | "ec"
  | "buying_first"
  | "investment"
  | "selling"
  | "condo_tips"
  | "landed"
  | "finance"
  | "legal";

export interface RadarTopic {
  id: string;
  title: string;
  searchIntent: string;
  category: TopicCategory;
  /** Approximate monthly search demand: high / medium / low */
  demand: "high" | "medium" | "low";
  /** Whether this is evergreen (true) or time-sensitive (false) */
  evergreen: boolean;
  tags: string[];
}

export const RADAR_TOPICS: RadarTopic[] = [
  // ── HDB Upgraders ──────────────────────────────────────────────────────────
  {
    id: "hdb-to-condo-upgrade",
    title: "How to Upgrade from HDB to Condo in Singapore",
    searchIntent: "HDB owners researching the upgrader journey: MOP, cash proceeds, ABSD",
    category: "hdb_upgrade",
    demand: "high",
    evergreen: true,
    tags: ["HDB", "MOP", "upgrader", "condo", "ABSD"],
  },
  {
    id: "hdb-cash-proceeds-after-sale",
    title: "How Much Cash Do You Actually Get After Selling Your HDB?",
    searchIntent: "HDB sellers trying to calculate net proceeds after CPF refund + loan",
    category: "selling",
    demand: "high",
    evergreen: true,
    tags: ["HDB", "CPF", "accrued interest", "net proceeds", "selling"],
  },
  {
    id: "can-i-buy-condo-while-owning-hdb",
    title: "Can I Buy a Condo While Still Owning My HDB?",
    searchIntent: "HDB owners asking if they can hold both properties and what ABSD applies",
    category: "hdb_upgrade",
    demand: "high",
    evergreen: true,
    tags: ["HDB", "condo", "ABSD", "second property", "upgrader"],
  },
  {
    id: "negative-cash-hdb-sale",
    title: "What Happens If You Have Negative Cash After Selling Your HDB?",
    searchIntent: "HDB owners worried their CPF accrued interest will eat all their sale proceeds",
    category: "hdb_upgrade",
    demand: "medium",
    evergreen: true,
    tags: ["HDB", "CPF accrued interest", "negative proceeds", "selling"],
  },
  // ── HDB Resale ─────────────────────────────────────────────────────────────
  {
    id: "hdb-resale-process",
    title: "HDB Resale Process Step by Step (Buyer's Guide 2026)",
    searchIntent: "First-time buyers wanting to understand HDB resale end-to-end",
    category: "hdb_resale",
    demand: "high",
    evergreen: false,
    tags: ["HDB resale", "OTP", "HFE", "step by step", "buyer guide"],
  },
  {
    id: "hdb-cov-explained",
    title: "What is COV in HDB Resale and Should You Pay It?",
    searchIntent: "Buyers confused about Cash-Over-Valuation and whether it's worth paying",
    category: "hdb_resale",
    demand: "medium",
    evergreen: true,
    tags: ["COV", "HDB resale", "cash over valuation", "negotiation"],
  },
  {
    id: "hdb-flat-eligibility",
    title: "Who Can Buy an HDB Resale Flat in Singapore? Eligibility Guide",
    searchIntent: "PRs, singles, couples checking if they qualify to buy HDB",
    category: "hdb_resale",
    demand: "medium",
    evergreen: true,
    tags: ["HDB eligibility", "PR", "single", "couple", "income ceiling"],
  },
  // ── EC ─────────────────────────────────────────────────────────────────────
  {
    id: "ec-vs-condo",
    title: "EC vs Condo: Which Is Better for Upgraders?",
    searchIntent: "HDB upgraders deciding between an EC and a private condo",
    category: "ec",
    demand: "high",
    evergreen: true,
    tags: ["EC", "executive condo", "condo", "upgrade", "HDB"],
  },
  {
    id: "ec-income-ceiling",
    title: "EC Income Ceiling 2026: Are You Eligible?",
    searchIntent: "Couples checking if their combined income qualifies for an EC",
    category: "ec",
    demand: "medium",
    evergreen: false,
    tags: ["EC", "income ceiling", "eligibility", "2026"],
  },
  {
    id: "ec-privatisation",
    title: "What Happens to Your EC After 10 Years?",
    searchIntent: "EC owners approaching the 10-year full privatisation mark",
    category: "ec",
    demand: "medium",
    evergreen: true,
    tags: ["EC", "privatisation", "10 years", "resale", "foreigner"],
  },
  // ── Finance ────────────────────────────────────────────────────────────────
  {
    id: "cpf-for-condo",
    title: "How Much CPF Can You Use to Buy a Condo?",
    searchIntent: "Upgraders unsure how much CPF OA they can use for a private property",
    category: "finance",
    demand: "high",
    evergreen: true,
    tags: ["CPF", "OA", "condo", "property", "withdrawal limit"],
  },
  {
    id: "absd-singapore-2026",
    title: "ABSD 2026: How Much Additional Stamp Duty Will You Pay?",
    searchIntent: "Buyers calculating ABSD on their second or third property",
    category: "finance",
    demand: "high",
    evergreen: false,
    tags: ["ABSD", "stamp duty", "second property", "2026"],
  },
  {
    id: "tdsr-explained",
    title: "TDSR Explained: How It Affects How Much You Can Borrow",
    searchIntent: "Buyers wanting to understand what banks look at when approving loans",
    category: "finance",
    demand: "medium",
    evergreen: true,
    tags: ["TDSR", "mortgage", "bank loan", "income", "borrowing capacity"],
  },
  {
    id: "fixed-vs-floating-rate",
    title: "Fixed vs Floating Rate Mortgage: Which Is Better in 2026?",
    searchIntent: "Property buyers deciding between fixed and floating home loan packages",
    category: "finance",
    demand: "medium",
    evergreen: false,
    tags: ["mortgage", "fixed rate", "floating rate", "SORA", "home loan"],
  },
  // ── Buying First Property ──────────────────────────────────────────────────
  {
    id: "first-time-buyer-guide",
    title: "First-Time Property Buyer in Singapore: Complete 2026 Guide",
    searchIntent: "Complete guide for Singaporeans buying their first home",
    category: "buying_first",
    demand: "high",
    evergreen: false,
    tags: ["first-time buyer", "HDB", "condo", "BTO", "guide"],
  },
  {
    id: "bto-vs-resale-hdb",
    title: "BTO vs Resale HDB: Which Should You Choose?",
    searchIntent: "First-time buyers deciding between BTO and resale HDB",
    category: "hdb_bto",
    demand: "high",
    evergreen: true,
    tags: ["BTO", "resale", "HDB", "waiting time", "grants"],
  },
  // ── Condo ──────────────────────────────────────────────────────────────────
  {
    id: "new-launch-vs-resale-condo",
    title: "New Launch vs Resale Condo: Pros, Cons and Which to Buy",
    searchIntent: "Condo buyers comparing new launches vs resale units",
    category: "condo_new_launch",
    demand: "high",
    evergreen: true,
    tags: ["new launch", "resale condo", "developer", "comparison"],
  },
  {
    id: "condo-rental-yield-singapore",
    title: "What Is a Good Rental Yield for a Condo in Singapore?",
    searchIntent: "Investors and upgraders evaluating condo rental income potential",
    category: "investment",
    demand: "medium",
    evergreen: true,
    tags: ["rental yield", "condo", "investment", "returns"],
  },
  // ── Selling ────────────────────────────────────────────────────────────────
  {
    id: "best-time-to-sell-hdb",
    title: "When Is the Best Time to Sell Your HDB Flat?",
    searchIntent: "HDB owners asking when to time their sale for best price",
    category: "selling",
    demand: "medium",
    evergreen: true,
    tags: ["selling", "HDB", "timing", "market", "COV"],
  },
  {
    id: "fixed-fee-agent-worth-it",
    title: "Is a Fixed-Fee Property Agent Worth It? HomeUp vs Commission Agents",
    searchIntent: "Sellers comparing fixed-fee agents to traditional 1–2% commission agents",
    category: "selling",
    demand: "medium",
    evergreen: true,
    tags: ["fixed fee", "agent", "commission", "HomeUp", "savings"],
  },
];

export const RADAR_WEIGHTS = {
  demand: { high: 1.0, medium: 0.6, low: 0.3 },
  evergreen: 0.2,
} as const;
