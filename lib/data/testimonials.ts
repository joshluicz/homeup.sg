export interface TestimonialColumnItem {
  text: string;
  name: string;
  role: string;
  /** Picks a decorative icon badge (flowers, objects, etc.). */
  avatarIndex: number;
}

type RawTestimonial = {
  name: string;
  role: string;
  text: string;
};

const RAW: RawTestimonial[] = [
  {
    name: "Ernest Lim",
    role: "HDB Seller",
    text: "Dennis and Kenji went beyond their scope, keeping a steady stream of buyers viewing my flat. Professional, friendly, and efficient throughout.",
  },
  {
    name: "Terrence Koh",
    role: "Condo Seller",
    text: "Tong Boon provided top-notch service for my condo sale. His commitment to the seller's interests was exceptional, and the whole process was seamless.",
  },
  {
    name: "Mark Kwok Leong",
    role: "HDB Seller",
    text: "Kenji helped us secure a buyer for my dad's flat above the last transacted price, and guided our family through a win-win sell-and-buy move.",
  },
  {
    name: "Kwok Yung",
    role: "Condo Seller",
    text: "Second time engaging Dennis and Kenji. They stayed committed through a longer sale, helped with negotiations, and were flexible at OTP signing.",
  },
  {
    name: "Rui Min & Cristal Tan",
    role: "HDB Sellers",
    text: "Fixed fee of $1,999 covered photos, portal listings, viewings, negotiation, and paperwork. Service matched a 1% agent we used elsewhere, at a fraction of the cost. Kenji served us.",
  },
  {
    name: "Mr & Mrs Zak",
    role: "HDB Sellers",
    text: "Kenji negotiated twice instead of taking the first low offer. Our flat sold in under a week. He stayed responsive through our next-home search and document signing.",
  },
  {
    name: "Apollos Tan",
    role: "HDB Buyer",
    text: "Tong Boon was patient, knowledgeable, and honest at every viewing. He handled negotiation and paperwork with care. We found our dream home stress-free.",
  },
  {
    name: "CL Long",
    role: "HDB Seller",
    text: "Tong Boon sold my unit within a month, slightly above valuation. Clear and never pushy, even with lower offers. I saved close to $28,000 in agent fees.",
  },
  {
    name: "Willy Tan",
    role: "HDB Seller",
    text: "Tong Boon's TikTok presence showed his dedication. Fast replies, solid financial advice, and sold in one week at a record price for my block.",
  },
  {
    name: "Eileen Tan",
    role: "Condo Seller",
    text: "Dennis and Kenji called the day after we reached out. Four viewings, under a month, asking price achieved with extension. The fixed $4,999 fee saved us thousands.",
  },
  {
    name: "HaoTing",
    role: "Condo Buyer",
    text: "Dennis helped with my first property purchase. Patient, never hard-sold, and trustworthy. I recommend him with confidence.",
  },
  {
    name: "Tarun",
    role: "HDB Seller",
    text: "Dennis guided us throughout, brought strong viewing traffic, stayed responsive, and negotiated skillfully when the deal needed it.",
  },
  {
    name: "Noel Bryan Ng",
    role: "Condo Buyer",
    text: "Dennis is analytical and dependable. He structures finances against market opportunities before recommending anything. Very responsive; I learned a lot from him.",
  },
  {
    name: "Christina Hu",
    role: "Condo Buyer",
    text: "Dennis was my main contact for my first private purchase. He worked in my interest, not to close fast for commission. I felt comfortable before committing.",
  },
  {
    name: "Glenn Koh",
    role: "HDB Seller",
    text: "Tong Boon made selling my HDB smooth and stress-free. Responsive, clear at every step, and handled timeline and paperwork with care.",
  },
  {
    name: "Crystal Tan",
    role: "Condo Seller",
    text: "Dennis and Tong Boon handled our sale professionally. Hosting viewings ourselves became easy after a few rounds. Fixed $4,999 pricing beat paying 1% commission.",
  },
  {
    name: "Carissa",
    role: "Condo Buyer",
    text: "We engaged Tong Boon again to buy our next home. He analysed every shortlist unit patiently and secured a deal $6K below what we had offered.",
  },
  {
    name: "Huang Bryan",
    role: "HDB Seller",
    text: "We switched from a 2% agent with no luck after three months. Kenji got us an offer with extension and we saved over $10k in fees.",
  },
  {
    name: "DS",
    role: "HDB Seller",
    text: "Kenji listed our unit quickly, bridged price expectations with the buyer, and prepared all documents. No hassle, no excuses.",
  },
  {
    name: "Evelyn Tan",
    role: "HDB Seller",
    text: "Dennis understood our goals, set a realistic price, and our home sold quickly at a number we were happy with. Professional and approachable.",
  },
  {
    name: "Kenneth Ho",
    role: "HDB Seller",
    text: "Dennis sold my unit in two weeks at a good price with much lower agent fees than percentage commission. The whole process ran smoothly.",
  },
  {
    name: "Carissa",
    role: "HDB Seller",
    text: "Dennis and the admin team coordinated viewings seamlessly. We hosted viewings; Dennis handled offers and closed within two weeks at a strong price.",
  },
];

export const HOMEUP_TESTIMONIALS: TestimonialColumnItem[] = RAW.map((item, index) => ({
  ...item,
  avatarIndex: (index * 5 + 3) % 12,
}));

export function splitTestimonialsIntoColumns(
  items: TestimonialColumnItem[],
  columnCount = 3,
): TestimonialColumnItem[][] {
  const size = Math.ceil(items.length / columnCount);
  return Array.from({ length: columnCount }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  ).filter((col) => col.length > 0);
}
