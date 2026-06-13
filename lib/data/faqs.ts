export interface FaqItem {
  q: string;
  a: string;
}

export const SELL_FAQ_GENERAL: FaqItem[] = [
  {
    q: "What exactly is HomeUP's fixed fee — is it really all-in?",
    a: "Yes. The fee is $1,999 (HDB), $4,999 (Condo/EC), or $9,999 (Landed) + GST. That covers the full end-to-end service: listing, marketing across all major portals, viewing coordination, negotiation, and documentation. There are no add-ons, no success fees on top, and no percentage of your sale price.",
  },
  {
    q: "How many viewings will I need to host?",
    a: "That depends on demand and your asking price, but most HomeUP sellers host between 5 and 15 viewings before accepting an offer. HomeUP screens all buyer enquiries before confirming a viewing, so the people who walk through your door are genuine, pre-qualified prospects — not casual browsers. We brief you beforehand on what buyers are likely to ask.",
  },
  {
    q: "Why is HomeUP's fee lower than a traditional agent?",
    a: "Three reasons: We operate at scale across 120+ active listings, which means our systems and marketing workflows are highly efficient. Our sellers host their own viewings, which removes the cost of an agent travelling to every showing. And we're built to run lean — digital-first operations with no traditional agency overhead. All of that means we can offer full-service representation at a fraction of the typical 2% commission.",
  },
  {
    q: "Can I sell and buy at the same time with HomeUP?",
    a: "Yes — in fact, it's one of our strengths. Sell-and-buy coordination is built into the HomeUP service. Your selling timeline and buying budget are planned together from the first consultation, so you're not rushing a purchase or accepting the wrong offer because timelines aren't aligned.",
  },
  {
    q: "What platforms will my home be listed on?",
    a: "Your listing goes live on PropertyGuru, SRX, 99.co, and HomeUP.sg — the four platforms that serious Singapore buyers use most. We also run targeted marketing across social media channels. You get the same exposure a traditional agent provides, without the percentage-based fee.",
  },
  {
    q: "How long does the selling process typically take?",
    a: "It varies by property type. HDB resales typically take 16–20 weeks from listing to completion once an offer is accepted, due to HDB Portal requirements and approval timelines. Condos typically take 20–24 weeks. Landed homes can take longer, often 24–32 weeks, as the buyer pool is smaller and legal checks are more involved. Marketing time before an offer is accepted depends on pricing and demand.",
  },
  {
    q: "What if I can't find my next home before my sale completes?",
    a: "This is one of the most common concerns for sellers, and HomeUP plans around it from the start. During your initial consultation, we map out realistic buying timelines alongside your selling timeline. In some cases, we can also negotiate extended completion periods with buyers to give you more time. We won't push you to accept an offer before you're ready.",
  },
];

export const SELL_FAQ_HDB: FaqItem[] = [
  {
    q: "Can I sell my HDB flat before the Minimum Occupation Period (MOP)?",
    a: "No. You must fulfil the MOP — typically 5 years of physical occupation — before you can sell your HDB flat on the open market. This applies to both BTO and resale flats. HomeUP will confirm your MOP status in your first consultation before any timeline is set.",
  },
  {
    q: "Do I need to return my CPF when I sell my HDB?",
    a: "Yes. The CPF funds used to purchase the flat — including the principal amount and accrued interest — must be returned to your CPF Ordinary Account upon sale. The accrued interest is calculated at 2.5% per annum from the date the funds were withdrawn. HomeUP will walk you through a net proceeds estimate so you know exactly what you'll receive.",
  },
  {
    q: "How long does the HDB resale process take from listing to completion?",
    a: "The full process typically takes 16–22 weeks from the date you accept an offer. This includes the 21-day option period, HDB Resale Portal submission, HDB approval (usually 4–6 weeks), and the completion appointment at HDB Hub. Marketing time before receiving an acceptable offer varies.",
  },
  {
    q: "Does HomeUP handle the HDB Resale Portal submission?",
    a: "Yes. Once the OTP is signed and the option fee is paid, HomeUP takes care of all documentation and HDB Resale Portal submission on your behalf. This includes coordinating with the buyer's agent, submitting the resale application, and tracking HDB's review timeline through to the completion appointment.",
  },
  {
    q: "What is the HDB valuation and when is it done?",
    a: "HDB requires a valuation report from a licensed valuer for resale transactions. The valuation is typically ordered after the OTP is exercised and is used to determine the maximum loan and CPF usage allowed for the buyer. HomeUP will guide you through the valuation timeline and what it means for your sale price.",
  },
  {
    q: "What if I can't find my next home before my HDB sale completes?",
    a: "This is something we plan for upfront. HomeUP coordinates your selling and buying timelines together so you're not left without a home. In some cases, we can negotiate a deferred completion with the buyer. We can also explore whether a temporary rental arrangement makes sense as a bridge. We won't rush you to accept an offer before your next move is secured.",
  },
  {
    q: "Will a higher asking price affect how quickly my flat sells?",
    a: "Pricing discipline is one of the most important parts of selling an HDB flat. Setting a price too high relative to recent transactions in your block and town will reduce enquiries significantly. HomeUP provides a data-backed price recommendation based on recent transacted prices — not an inflated number designed to win your listing.",
  },
];

export const SELL_FAQ_CONDO: FaqItem[] = [
  {
    q: "Does Seller's Stamp Duty (SSD) apply to my condo sale?",
    a: "SSD applies if you sell within 3 years of purchasing the property. The rates are 12% (sold within 1 year), 8% (within 2 years), and 4% (within 3 years) of the sale price or market value, whichever is higher. HomeUP will confirm whether SSD applies in your first consultation before any listing timeline is set.",
  },
  {
    q: "Can I sell an Executive Condominium (EC)?",
    a: "Yes. ECs are eligible for open-market sale after the 5-year Minimum Occupation Period (MOP). Before MOP, they can only be sold back to HDB. After 10 years, ECs are fully privatised and can be sold to foreigners. HomeUP handles EC sales and will confirm your MOP and eligibility status upfront.",
  },
  {
    q: "How is the condo resale process different from HDB?",
    a: "Condo resales do not involve HDB Portal submission, but they do require a Sale & Purchase (S&P) Agreement drawn up by lawyers, and the process is governed by private conveyancing timelines. The OTP period is typically 14 days, and legal completion usually takes 10–12 weeks after the S&P is signed. HomeUP coordinates with both parties' solicitors through to completion.",
  },
  {
    q: "Can foreigners buy my resale condo?",
    a: "Yes. Singapore permanent residents and foreigners are eligible to purchase resale condominium units — unlike landed properties and HDB flats, which have restrictions. This broader buyer pool is one reason condo marketing benefits from wide-reach listings across all major platforms.",
  },
  {
    q: "How long does a condo sale typically take from listing to completion?",
    a: "Marketing time varies, but once an offer is accepted, the process typically takes 20–24 weeks to legal completion. This includes the OTP period (14 days), S&P signing (typically 4 weeks after OTP), and legal completion (usually 10–12 weeks after S&P). HomeUP tracks all deadlines and coordinates with lawyers on your behalf.",
  },
  {
    q: "What happens between the OTP and legal completion?",
    a: "After the buyer exercises the OTP and pays the 4% balance of the option fee, the Sale & Purchase Agreement is prepared by lawyers. The buyer's loan approval is confirmed, insurance is arranged, and any outstanding loan on your end is discharged. HomeUP coordinates with your lawyer to ensure everything runs to schedule.",
  },
  {
    q: "Do I need to hire a lawyer separately?",
    a: "Yes. For private property transactions, both the buyer and seller are required to engage their own solicitors. HomeUP will recommend experienced conveyancing lawyers you can engage, but the legal fee is separate from HomeUP's flat fee. Typical conveyancing fees for sellers range from $2,000 to $3,500 + GST.",
  },
];

export const SELL_FAQ_LANDED: FaqItem[] = [
  {
    q: "Who can buy my landed property in Singapore?",
    a: "Singapore citizens can purchase most landed property types without restriction. Singapore PRs and foreigners require approval from the Land Dealings Approval Unit (LDAU) under the Residential Property Act — which limits their ability to buy most landed homes. Strata landed properties (like cluster houses) are generally more accessible to PRs. HomeUP will factor this into the buyer targeting strategy for your home.",
  },
  {
    q: "How long does selling a landed home typically take?",
    a: "Landed sales typically have a longer marketing cycle than HDB or condo sales due to the smaller pool of qualified buyers. Marketing time can range from 4 to 16 weeks depending on pricing, condition, and market demand. Once an offer is accepted, legal completion takes approximately 24–32 weeks. HomeUP approaches landed sales with patient, targeted marketing rather than broad-reach volume.",
  },
  {
    q: "Is a freehold property easier to sell than a leasehold?",
    a: "Freehold and 999-year leasehold properties are generally more sought-after than 99-year leasehold landed homes, particularly for buyers who plan to hold long-term or pass the property to family. That said, pricing discipline matters more than tenure — an overpriced freehold property will sit longer than a well-priced leasehold. HomeUP factors tenure into pricing guidance from the start.",
  },
  {
    q: "How do you price a landed property accurately?",
    a: "Landed property pricing is more nuanced than HDB or condo — location, plot size, land shape, orientation, road frontage, and tenure all affect value. HomeUP uses recent transacted prices for comparable landed homes in your area, adjusting for these factors to give you a data-backed price recommendation. We do not inflate the asking price to win your listing.",
  },
  {
    q: "Will HomeUP vet buyers before they view my property?",
    a: "Yes. For landed homes, HomeUP screens all buyer enquiries before a viewing is confirmed. This includes a basic financial qualification check and confirming the buyer's eligibility to purchase (citizenship / PR status). This protects your time and ensures only serious, eligible buyers walk through your home.",
  },
  {
    q: "Do I need to hire a lawyer separately for a landed sale?",
    a: "Yes. Private property transactions require both parties to engage their own solicitors. HomeUP can recommend experienced conveyancing lawyers, but legal fees are separate from HomeUP's flat fee. For landed homes, conveyancing fees are typically $3,000–$5,000 + GST depending on the complexity of the transaction.",
  },
  {
    q: "How does HomeUP handle negotiation for higher-value landed homes?",
    a: "Negotiation for landed homes requires patience and a clear understanding of comparable transactions. HomeUP presents all offers with a full assessment of terms — not just the headline price — including payment schedule, timeline, and any conditions attached. We do not pressure you to accept an offer before you're confident in the outcome.",
  },
];

export const BUY_FAQ_GENERAL: FaqItem[] = [
  {
    q: "Is buyer representation really free for condo, landed, and new launch purchases?",
    a: "Yes. For resale condo, landed, and new launch purchases, HomeUP's buyer representation is complimentary — you pay nothing. The agent's fee for these transactions is covered by the seller (for resale) or developer (for new launch). The only exception is HDB resale, where HomeUP charges a fixed $1,999 + GST for buyer representation.",
  },
  {
    q: "Why would HomeUP help me buy for free — what's the catch?",
    a: "There's no catch. For resale private property and new launch purchases, the market convention is for the seller or developer to pay the buyer's agent. HomeUP operates the same way. What makes us different is that our advice stays neutral — we're not incentivised to push you toward a higher-priced unit or a specific developer because our fee isn't tied to your purchase price.",
  },
  {
    q: "What does buyer representation actually include?",
    a: "HomeUP's buyer representation covers the full journey: affordability planning and financing guidance, property shortlisting, viewing coordination, offer and negotiation strategy, OTP and S&P review, and documentation through to completion. For HDB buyers, this also includes CPF grant planning and HDB resale checklist management.",
  },
  {
    q: "Can HomeUP help if I'm selling and buying at the same time?",
    a: "Yes — and this is one of HomeUP's core strengths. Sell-and-buy coordination means your selling timeline, purchase budget, and loan planning are mapped out together from day one. This reduces the risk of a rushed purchase, a forced sale, or a timing mismatch that leaves you between homes.",
  },
  {
    q: "How do I start the buying process with HomeUP?",
    a: "Book a free 30-minute planning consultation via WhatsApp or the form on this page. There's no commitment required. We'll review your financial position, discuss your goals, and map out a realistic path — whether you're a first-time buyer, upgrader, or investor.",
  },
  {
    q: "How is HomeUP different from approaching a developer or agent directly?",
    a: "When you engage HomeUP, you get neutral advice — we compare projects, flag risks, and select units based on your needs, not on which developer pays the highest co-brokerage fee. Approaching a developer's sales team directly means getting sales-driven guidance. With HomeUP, you have an advisor whose interests are aligned with yours.",
  },
];

export const BUY_FAQ_HDB: FaqItem[] = [
  {
    q: "What CPF grants am I eligible for when buying an HDB resale flat?",
    a: "Eligibility depends on your citizenship status, income, and property history. Key grants include the Enhanced CPF Housing Grant (up to $80,000 for first-timers), the Family Grant ($50,000 for couples), and the Proximity Housing Grant ($30,000 for buying near parents). HomeUP reviews your grant eligibility in the first consultation before you begin shortlisting.",
  },
  {
    q: "Should I take an HDB loan or a bank loan?",
    a: "HDB loans offer a fixed rate of 2.6% and allow up to 80% financing with a 20% cash/CPF downpayment. Bank loans typically offer lower starting rates but can fluctuate, and require a 25% downpayment (5% in cash). The right choice depends on your financial buffer, risk tolerance, and whether you're likely to want flexibility to refinance. HomeUP walks you through both options at the planning stage.",
  },
  {
    q: "Can I buy an HDB resale flat if I currently own private property?",
    a: "No. If you or your co-applicant own private residential property, you are not eligible to buy an HDB flat directly. You would need to dispose of the private property first and observe a 15-month wait before purchasing an HDB resale flat. HomeUP will flag any eligibility constraints before you begin your search.",
  },
  {
    q: "What is the HDB resale levy and does it apply to me?",
    a: "The resale levy applies if you are buying a second subsidised HDB flat (e.g., a second BTO or an HDB sale-of-balance flat) after already selling a subsidised flat. It does not apply to resale flat purchases on the open market. If you're buying resale, the levy is not a factor — but HomeUP will confirm this for your specific situation.",
  },
  {
    q: "How long does the HDB resale buying process take?",
    a: "From the time you receive and exercise an OTP, the full process typically takes 16–20 weeks to completion. This includes the HDB Resale Portal submission, grant processing, HDB valuation, and the final completion appointment at HDB Hub. The time between starting your search and receiving an acceptable OTP varies by demand and your pricing discipline as a buyer.",
  },
  {
    q: "Can I start buying before I've sold my current home?",
    a: "It depends on your financial position. If you can service two loans simultaneously, or if you're using cash for the resale purchase, it's possible to buy before you sell. However, most HDB upgraders need the CPF proceeds from their sale to fund the purchase. HomeUP maps out your cash flow at the planning stage to determine the safest sequencing for your situation.",
  },
  {
    q: "Is there a minimum occupation period I should know about as a buyer?",
    a: "As a buyer, you become subject to a new MOP from the date you take possession. For HDB resale flats, the MOP is 5 years — during which you cannot sell on the open market or rent out the whole flat. There is no MOP constraint for the seller of a resale flat (they would have already fulfilled theirs). HomeUP will explain what the MOP means for your plans.",
  },
];

export const BUY_FAQ_CONDO: FaqItem[] = [
  {
    q: "Do I pay any commission as a buyer for resale condo or landed?",
    a: "No. For resale private property transactions, HomeUP's buyer representation is complimentary — the fee is covered by the seller's side of the transaction. You pay nothing to HomeUP for buying a resale condo or landed home.",
  },
  {
    q: "What is ABSD and how much do I pay?",
    a: "Additional Buyer's Stamp Duty (ABSD) is a tax payable on top of Buyer's Stamp Duty (BSD) for certain buyers. Singapore citizens pay 0% ABSD on their first property, 20% on their second, and 30% on their third and beyond. PRs pay 5% on their first and 30% on subsequent purchases. Foreigners pay 60% on any residential property. HomeUP factors ABSD into your affordability calculation at the planning stage.",
  },
  {
    q: "Can foreigners buy resale condo in Singapore?",
    a: "Yes. Foreigners can purchase most resale condominium units in Singapore without restriction, subject to ABSD of 60%. There are exceptions — HDB flats and most landed properties are not available to foreigners. If you are a non-citizen or non-PR buyer, HomeUP will confirm which properties you are eligible to purchase.",
  },
  {
    q: "What checks should I do before making an offer on a condo?",
    a: "Key checks include: outstanding mortgage on the unit (to confirm the seller can transact cleanly), outstanding management fees or sinking fund arrears, any existing tenancy and its end date, SSD applicability for the seller, and recent transacted prices for comparable units in the same development. HomeUP reviews all of these before we advise you to make an offer.",
  },
  {
    q: "How does sell-and-buy timing work for private property?",
    a: "Private property completions typically take 20–24 weeks from OTP. If you're selling and buying simultaneously, the key is aligning the completion dates or negotiating a deferred completion on one side. HomeUP coordinates both transactions so you're not in a position where you've committed to a purchase before your sale proceeds are confirmed.",
  },
  {
    q: "What is the difference between buying resale condo and new launch?",
    a: "Resale condos are existing completed units — you can view the actual unit, move in faster, and assess the condition before committing. New launches are purchased off-plan from developers with delivery typically 3–5 years away. New launches allow progressive payment over construction, while resale requires full payment at completion. HomeUP helps you compare both objectively based on your timeline and goals.",
  },
];

export const BUY_FAQ_NEW_LAUNCH: FaqItem[] = [
  {
    q: "How does the new launch ballot or queue process work?",
    a: "For popular new launches, developers typically hold an official launch day where registered buyers are balloted for a queue number. Your queue number determines when you enter the showflat to select a unit. HomeUP helps you register interest early, understand which stacks to target, and be ready to make a decision on launch day — when time pressure is highest.",
  },
  {
    q: "What is the payment schedule when buying a new launch?",
    a: "New launch payments follow the Progressive Payment Scheme (PPS) tied to construction milestones. A typical breakdown: 5% option fee + 15% within 8 weeks of OTP exercise (foundation, framework, concrete, etc.) with subsequent stages at various percentages through to TOP. This means you're not paying the full amount upfront — payments are spread over 3–5 years of construction.",
  },
  {
    q: "Does HomeUP represent buyers for all new launch projects?",
    a: "HomeUP works with a wide range of developers across the Singapore market and has access to most major new launch projects. For projects we have direct marketing appointments with, we can offer priority unit information and preview access. For others, we can still provide independent analysis and attend the launch with you as your buyer's representative.",
  },
  {
    q: "When can I expect to receive my keys for a new launch unit?",
    a: "New launch units are delivered at Temporary Occupation Permit (TOP), typically 3–5 years after the launch date depending on the development timeline. After TOP, the unit must pass inspection (snagging) before key collection. HomeUP can help coordinate the snagging process to ensure any defects are rectified before you move in.",
  },
  {
    q: "How do I compare different new launch projects objectively?",
    a: "Key factors include: location and connectivity, developer track record and construction quality, pricing per square foot vs comparables in the area, floor plan efficiency, stack orientation (facing, noise, privacy), and projected resale potential based on supply in the area. HomeUP provides an independent analysis across all these dimensions so you can compare projects without showroom pressure.",
  },
  {
    q: "What happens if I change my mind after signing the Option?",
    a: "If you do not exercise the Option to Purchase (OTP) after paying the 5% option fee, you forfeit that amount. Once the OTP is exercised and the S&P is signed, backing out carries more significant legal and financial consequences. HomeUP ensures you have full clarity on all terms and have done thorough due diligence before you sign anything.",
  },
];
