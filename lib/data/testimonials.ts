export interface TestimonialColumnItem {
  text: string;
  name: string;
  source?: "Google" | "Facebook";
  /** Path to an agent-and-client photo (relative to /public). Shows as card banner. */
  photo?: string;
  /** CSS object-position for the photo crop, e.g. "top", "center", "50% 20%". Defaults to "center". */
  photoPosition?: string;
  /** Picks a colour for the initials avatar (used when no photo is set). */
  avatarIndex: number;
}

type RawTestimonial = {
  name: string;
  text: string;
  source?: "Google" | "Facebook";
  photo?: string;
  photoPosition?: string;
};

const RAW: RawTestimonial[] = [
  // ── COLUMN 1 — interleaved Dennis + Tong Boon ─────────────────────────────
  {
    name: "Ng Chee Yan",
    source: "Google",
    photo: "/images/testimonials/ng-chee-yan-tong-boon.png",
    photoPosition: "top",
    text: "I've been following Dennis on TikTok for over a year, and when my wife and I decided to sell, Dennis set up a Zoom meeting straightaway. Our house was listed on 5 platforms. Within 2 weeks, 5 serious buyers were shortlisted and a deal was done at the best price. A cohesive, professional team that places the client's interests at heart.",
  },
  {
    name: "Ernest Lim",
    source: "Google",
    text: "Dennis and Kenji went beyond their scope, keeping a steady stream of buyers viewing my flat. Professional, friendly, and efficient throughout.",
  },
  {
    name: "Corinne Seah",
    source: "Google",
    photo: "/images/testimonials/corinne-seah.png",
    photoPosition: "50% 60%",
    text: "No exclusive to tie me down & fixed fee — that's what drew me in. Dennis was proactive: pictures taken, listed on 5 platforms, many viewings. My house sold at a RECORD PRICE and I saved S$19K in commission. Everything was smooth, they responded fast, and Dennis still gives me valuable tips even after the sale. Down-to-earth, genuine people — where else to find?!",
  },
  {
    name: "Terrence Koh",
    source: "Google",
    text: "Tong Boon provided top-notch service for my condo sale. His commitment to the seller's interests was exceptional, and the whole process was seamless.",
  },
  {
    name: "HaoTing",
    source: "Google",
    text: "Dennis helped with my first property purchase. Patient, never hard-sold, and trustworthy. I recommend him with confidence.",
  },
  {
    name: "Muhammad Azhar",
    source: "Google",
    photo: "/images/testimonials/muhammad-azhar.png",
    photoPosition: "top",
    text: "Tong Boon explained the service and how it was different from others. My wife and I agreed to engage him for both selling and buying. He's knowledgeable, patient, and gave sound advice on market sentiment and COV. Very helpful and calm — mindful of our needs at every step. The value of his services goes far beyond the reasonable charges.",
  },
  {
    name: "Kwok Yung",
    source: "Google",
    text: "Second time engaging Dennis and Kenji. They stayed committed through a longer sale, helped with negotiations, and were flexible at OTP signing.",
  },
  {
    name: "Glenn Koh",
    source: "Google",
    text: "Tong Boon made selling my HDB smooth and stress-free. Responsive, clear at every step, and handled timeline and paperwork with care.",
  },
  {
    name: "Cray Oh",
    source: "Google",
    photo: "/images/testimonials/cray-oh.png",
    photoPosition: "50% 40%",
    text: "Came across the team online when searching for a fixed-rate agent. Dennis and his team are very responsive and answered all my questions. Managed to save quite a bit on commission, and I really felt they had our best interests at heart.",
  },
  {
    name: "Mark Kwok Leong",
    source: "Google",
    text: "Kenji helped us secure a buyer for my dad's flat above the last transacted price, and guided our family through a win-win sell-and-buy move.",
  },
  {
    name: "Carissa Lim",
    source: "Google",
    text: "We engaged Tong Boon again to buy our next home. He analysed every shortlist unit patiently and secured a deal $6K below what we had offered.",
  },
  {
    name: "Raymond Kuan",
    source: "Google",
    photo: "/images/testimonials/raymond-kuan.png",
    photoPosition: "top",
    text: "Had a great experience. Tong Boon was knowledgeable, dedicated and passionate about his work. Always responsive no matter the time and negotiated hard on our behalf. Dennis and Kenji were fantastic too. We will certainly engage them again for future property transactions.",
  },
  {
    name: "Noel Bryan Ng",
    source: "Google",
    text: "Dennis is analytical and dependable. He structures finances against market opportunities before recommending anything. Very responsive; I learned a lot from him.",
  },

  // ── COLUMN 2 — interleaved Dennis + Tong Boon ─────────────────────────────
  {
    name: "Darul Nizam",
    source: "Google",
    photo: "/images/testimonials/darul-nizam.png",
    photoPosition: "center",
    text: "Tong Boon, we wanted to express our gratitude for your exceptional service. Your knowledge of the local market, communication skills, and dedication to finding our dream home were impressive. You truly went above and beyond, making the process smooth and stress-free. Highly recommended to anyone buying or selling.",
  },
  {
    name: "Eileen Tan",
    source: "Google",
    text: "Dennis and Kenji called the day after we reached out. Four viewings, under a month, asking price achieved with extension. The fixed $4,999 fee saved us thousands.",
  },
  {
    name: "Gabriel Sim",
    source: "Google",
    photo: "/images/testimonials/gabriel-sim-kenji.png",
    photoPosition: "top",
    text: "Very prompt team, hardworking! We closed our simultaneous sell and purchase of new home in just 2–3 weeks. Thanks Dennis, Kenji, Tong Boon, and the entire team of admin working behind the scenes.",
  },
  {
    name: "Apollos Tan",
    source: "Google",
    text: "Tong Boon was patient, knowledgeable, and honest at every viewing. He handled negotiation and paperwork with care. We found our dream home stress-free.",
  },
  {
    name: "Christina Hu",
    source: "Google",
    text: "Dennis was my main contact for my first private purchase. He worked in my interest, not to close fast for commission. I felt comfortable before committing.",
  },
  {
    name: "Cath Seah",
    source: "Google",
    photo: "/images/testimonials/cath-seah.png",
    photoPosition: "top",
    text: "Got to know the team through a YouTube video. They seemed too good to be true — but it turned out to be one of the best decisions I've ever made. Tong Boon provided thorough market research, excellent marketing across all major platforms, and broke the highest sales record in my neighbourhood within two weeks of listing.",
  },
  {
    name: "Rui Min & Cristal Tan",
    source: "Google",
    text: "Fixed fee of $1,999 covered photos, portal listings, viewings, negotiation, and paperwork. Service matched a 1% agent we used elsewhere, at a fraction of the cost. Kenji served us.",
  },
  {
    name: "Evelyn Tan",
    source: "Google",
    text: "Dennis understood our goals, set a realistic price, and our home sold quickly at a number we were happy with. Professional and approachable.",
  },
  {
    name: "Ee Xuan Ng",
    source: "Google",
    photo: "/images/testimonials/ee-xuan-ng.png",
    photoPosition: "center",
    text: "My husband and I had Tong Boon to sell our property and purchase our new place. We were delighted when we managed to secure a record price for our unit. The team were really efficient and knowledgeable, with a lot of initiative taken. Very competitive rates. Highly recommend!",
  },
  {
    name: "Mr & Mrs Zak",
    source: "Google",
    text: "Kenji negotiated twice instead of taking the first low offer. Our flat sold in under a week. He stayed responsive through our next-home search and document signing.",
  },
  {
    name: "Crystal Tan",
    source: "Google",
    text: "Dennis and Tong Boon handled our sale professionally. Hosting viewings ourselves became easy after a few rounds. Fixed $4,999 pricing beat paying 1% commission.",
  },
  {
    name: "Marcus Lian",
    source: "Google",
    photo: "/images/testimonials/marcus-lian.png",
    photoPosition: "top",
    text: "My parents saved more than $50K in commissions versus percentage-based agents. Dennis, Tong Boon and Kenji proved every doubt wrong — they managed viewings, negotiated firmly, and were always honest. The final price exceeded expectations. They even structured the timeline so my parents could sell and move without renting temporary accommodation. It's not about fixed fee vs percentage — it's about agents who genuinely care.",
  },
  {
    name: "Tarun",
    source: "Google",
    text: "Dennis guided us throughout, brought strong viewing traffic, stayed responsive, and negotiated skillfully when the deal needed it.",
  },

  // ── COLUMN 3 — interleaved Tong Boon + Dennis ─────────────────────────────
  {
    name: "Louis",
    source: "Google",
    photo: "/images/testimonials/louis.png",
    photoPosition: "top",
    text: "Tong Boon helped me sell my HDB at $1,999 and buy my condo at $2,999 — a new service where they negotiate without relying on seller commission. They managed to bargain more than $2,999 off my expected purchase price. Thank you Tong Boon and Kenji for making the entire process a pleasant one.",
  },
  {
    name: "DS",
    source: "Google",
    text: "Kenji listed our unit quickly, bridged price expectations with the buyer, and prepared all documents. No hassle, no excuses.",
  },
  {
    name: "Julian Ho",
    source: "Google",
    photo: "/images/testimonials/julian-ho.png",
    photoPosition: "top",
    text: "Tong Boon was an exceptional housing agent who helped us sell our first home at a great deal. Professional, knowledgeable, and always available to answer our questions promptly. His market expertise and strong negotiation skills ensured we got the best possible outcome. The entire process was smooth and stress-free.",
  },
  {
    name: "Willy Tan",
    source: "Facebook",
    text: "Tong Boon's TikTok presence showed his dedication. Fast replies, solid financial advice, and sold in one week at a record price for my block.",
  },
  {
    name: "Kaung Myat Zaw",
    source: "Google",
    photo: "/images/testimonials/kaung-myat-zaw.png",
    photoPosition: "center",
    text: "Noticed them on TikTok — seemed too good to be true, but it was one of the best decisions I've made. Tong Boon's market research led to several bids in the first week and a sale above asking price. On the buying side, he was equally impressive — always available, even late at night. His commitment to informed decisions and negotiation skills were second to none.",
  },
  {
    name: "Kenneth Ho",
    source: "Google",
    text: "Dennis sold my unit in two weeks at a good price with much lower agent fees than percentage commission. The whole process ran smoothly.",
  },
  {
    name: "Tan Soon Geok",
    source: "Google",
    photo: "/images/testimonials/tan-soon-geok.png",
    photoPosition: "50% 70%",
    text: "I am very lucky to have engaged Tong Boon. He is professional, efficient, and works late into the night to help clients. My flat was sold at a premium price within two days of viewing, and his negotiating skills netted a great sale plus a grant for a stay period. Kenji's photography caught the eye of many buyers. Thumbs up to both!",
  },
  {
    name: "Huang Bryan",
    source: "Facebook",
    text: "We switched from a 2% agent with no luck after three months. Kenji got us an offer with extension and we saved over $10k in fees.",
  },
  {
    name: "Esther Chang",
    source: "Google",
    photo: "/images/testimonials/esther-chang.png",
    photoPosition: "top",
    text: "Tong Boon truly exceeded my expectations and sold my flat within 3 weeks. Fast and responsive — so much better than many other agents. Low commission, homeowners host viewings on their own schedule, and you can genuinely share the positives with buyers without pushy sales talk. Brilliant model.",
  },
  {
    name: "CL Long",
    source: "Google",
    text: "Tong Boon sold my unit within a month, slightly above valuation. Clear and never pushy, even with lower offers. I saved close to $28,000 in agent fees.",
  },
  {
    name: "Mok Kiew Luong",
    source: "Google",
    photo: "/images/testimonials/mok-kiew-luong.png",
    photoPosition: "center",
    text: "Engaged the team in May 2024 to sell my 5-room HDB. Professional and prompt from the outset. Tong Boon secured a very good deal and his advice throughout was invaluable. Their selling strategy far outpaces traditional agents — helping homeowners lower commissions so they keep more cash for their next home. Highly recommended.",
  },
  {
    name: "Carissa Wong",
    source: "Google",
    text: "Dennis and the admin team coordinated viewings seamlessly. We hosted viewings; Dennis handled offers and closed within two weeks at a strong price.",
  },
  {
    name: "Yong Li",
    source: "Google",
    photo: "/images/testimonials/yong-li.png",
    photoPosition: "top",
    text: "Couldn't be happier with Tong Boon's exceptional service. From expertly broadcasting the listing to engaging buyers and securing a record-price offer within just one week — his dedication was truly remarkable. All of this for a fixed fee of $1,999. His expertise made the selling process effortless and highly rewarding. Highly recommended!",
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
