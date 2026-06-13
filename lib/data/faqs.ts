export interface FaqItem {
  q: string;
  a: string;
}

export const HOMEPAGE_FAQ: FaqItem[] = [
  {
    q: "Why is HomeUP's fee so much lower if the service is full?",
    a: "HomeUP is built to run lean. You host viewings at home, we list at scale across more than 120 active homes, and we do not carry a traditional agency floor plan. Pricing, negotiation, paperwork, and timeline planning still sit with your CEA-licensed advisor. The fee stays fixed because our model does not depend on pushing your sale price higher to earn more.",
  },
  {
    q: "Does a fixed fee mean my agent cares less about my sale price?",
    a: "No. A percentage commission rises when your price rises, which can tempt an agent to chase a higher headline number even when it slows the sale. HomeUP advisors are not paid that way. They still have a professional stake in a clean transaction and in your outcome, but the fee does not scale with your sale price.",
  },
  {
    q: "What do I handle myself compared with a traditional listing?",
    a: "You host viewings at your home. HomeUP screens enquiries first, briefs you on serious buyers, and handles listing creation, portal marketing, offer review, negotiation, and documentation. If you prefer not to host viewings, tell your advisor early so you can plan around it.",
  },
  {
    q: "Is HomeUP a discount broker or a full agency?",
    a: "HomeUP is a full agency under C and H Properties (CEA licence L3007139C). The difference is the fee model, not the scope. You get portal listings, marketing support, negotiation, and completion paperwork. The flat fee replaces percentage commission, not the work that affects your result.",
  },
  {
    q: "Can HomeUP coordinate a sale and a purchase at the same time?",
    a: "Yes. Sell-and-buy planning is one of the most common reasons families come to us. Your sale timeline, purchase budget, and loan position are mapped together from the first consultation so you are not forced into a rushed purchase or a weak offer because dates do not line up.",
  },
  {
    q: "If my home sells for well above $500,000, do I still pay the same fixed fee?",
    a: "Yes. HDB is $1,999, condo and EC is $4,999, and landed is $9,999, each plus GST. The fee does not rise with your sale price. That is the point of a fixed-fee model: you know the number before you sign, regardless of how strong the final offer is.",
  },
  {
    q: "How is HomeUP different from a typical 2% commission agent in practice?",
    a: "The day-to-day work is similar: list, market, negotiate, complete. The incentive structure is not. A 2% agent earns more when you sell for more. HomeUP earns the same fixed fee whether your flat sells at valuation or well above it, which keeps pricing advice and negotiation focused on your net proceeds and timeline.",
  },
];

export const SELL_FAQ_GENERAL: FaqItem[] = [
  {
    q: "What is included in HomeUP's fixed fee?",
    a: "The fee is $1,999 for HDB, $4,999 for condo or EC, and $9,999 for landed, each plus GST. It covers listing on major portals, marketing support, buyer screening, viewing coordination, negotiation, and sales documentation through to completion. There is no success fee on top and no percentage of your sale price.",
  },
  {
    q: "Why is HomeUP's fee lower than a traditional agent?",
    a: "HomeUP runs at scale across more than 120 active listings, so listing and marketing workflows are shared efficiently. Sellers host their own viewings, which removes the cost of an agent travelling to every showing. We also operate without a traditional high-overhead agency setup. Those savings are passed through as a fixed fee instead of a 2% commission.",
  },
  {
    q: "How many viewings should I expect to host?",
    a: "It depends on price and demand. Many sellers host between 5 and 15 viewings before accepting an offer. HomeUP screens enquiries before confirming a slot, so the people who arrive are usually serious prospects, not casual browsers. Your advisor will brief you on what buyers are likely to ask before each session.",
  },
  {
    q: "Can I sell and buy at the same time with HomeUP?",
    a: "Yes. Sell-and-buy coordination is built into how we work. Your sale timeline, purchase budget, and loan planning are mapped together from the first consultation so you are not accepting the wrong offer or rushing a purchase because dates were never aligned.",
  },
  {
    q: "What if I cannot find my next home before my sale completes?",
    a: "That is one of the most common concerns we hear. We plan for it upfront: realistic buying timelines beside your sale, and in some cases a longer completion window negotiated with the buyer. We will not push you to accept an offer before your next move is workable.",
  },
  {
    q: "How long does selling typically take after I accept an offer?",
    a: "HDB resales often take 16 to 20 weeks from accepted offer to completion because of HDB Portal steps. Condos often take 20 to 24 weeks. Landed can take 24 to 32 weeks because the buyer pool is smaller and legal checks take longer. Time on market before an offer depends on pricing and demand.",
  },
];

export const SELL_FAQ_HDB: FaqItem[] = [
  {
    q: "How much CPF must I return when I sell my HDB flat?",
    a: "CPF funds used to buy the flat, including accrued interest, must go back to your CPF Ordinary Account on sale. Accrued interest is calculated at 2.5% per year from the date of withdrawal. HomeUP prepares a net proceeds estimate in your first consultation so you know what cash you will actually receive.",
  },
  {
    q: "How long does an HDB resale take from accepted offer to completion?",
    a: "Most resales take 16 to 22 weeks after you accept an offer. That includes the 21-day option period, HDB Resale Portal submission, HDB approval (often 4 to 6 weeks), and completion at HDB Hub. Time to receive a suitable offer before that depends on pricing and demand in your town.",
  },
  {
    q: "Does HomeUP handle the HDB Resale Portal submission?",
    a: "Yes. After the OTP is signed and the option fee is paid, HomeUP prepares the documentation and submits through the HDB Resale Portal. We coordinate with the buyer's agent, track HDB's review, and work through to the completion appointment.",
  },
  {
    q: "When is the HDB valuation done and why does it matter?",
    a: "A licensed valuer's report is usually ordered after the buyer exercises the OTP. It affects the buyer's maximum loan and CPF usage, which can influence whether the deal proceeds at your agreed price. HomeUP explains the valuation timeline and what it means for your sale before you commit to a price.",
  },
  {
    q: "What if I need to buy my next home before this sale completes?",
    a: "We map sale and purchase dates together from the start. In some cases we negotiate a deferred completion with the buyer, or discuss a short rental bridge if that is safer for your family. We will not rush you into an offer that leaves you without a realistic plan for your next home.",
  },
  {
    q: "Will pricing above recent block transactions slow my sale?",
    a: "Usually, yes. Buyers compare your asking price to recent transactions in your block and town. A number set too high to win the listing often kills enquiry volume. HomeUP recommends a price backed by recent transacted data, not an inflated figure designed to secure your signature.",
  },
];

export const SELL_FAQ_CONDO: FaqItem[] = [
  {
    q: "Does Seller's Stamp Duty apply to my condo sale?",
    a: "SSD applies if you sell within three years of purchase. Rates are 12% within one year, 8% within two years, and 4% within three years, based on the higher of sale price or market value. HomeUP confirms whether SSD applies in your first consultation before any listing date is set.",
  },
  {
    q: "Can I sell an Executive Condominium on the open market?",
    a: "After the five-year Minimum Occupation Period, an EC can be sold on the open market like a private condo. Before MOP, resale is back to HDB only. After privatisation (typically ten years), foreign buyers may also be eligible. HomeUP confirms your status before marketing begins.",
  },
  {
    q: "How is a condo resale different from an HDB resale?",
    a: "There is no HDB Portal. The sale runs on private conveyancing: OTP, Sale and Purchase Agreement, and lawyer-led completion. OTP is typically 14 days, and legal completion is often 10 to 12 weeks after the S and P is signed. HomeUP coordinates with both sides' solicitors through to completion.",
  },
  {
    q: "Can foreigners buy my resale condo?",
    a: "In most cases, yes. Foreigners and permanent residents can buy resale condominium units, unlike most HDB flats and landed homes. That wider buyer pool is one reason broad portal marketing matters. HomeUP still qualifies enquiries so viewings are not wasted.",
  },
  {
    q: "What happens between OTP exercise and legal completion?",
    a: "After the buyer exercises the OTP and pays the balance of the option fee, lawyers draft the Sale and Purchase Agreement. The buyer's loan is confirmed, insurance is arranged, and your outstanding loan is discharged. HomeUP tracks deadlines and keeps your lawyer and the buyer's team aligned.",
  },
  {
    q: "Do I need my own lawyer for a condo sale?",
    a: "Yes. Private property sales require separate solicitors for buyer and seller. HomeUP can refer experienced conveyancing lawyers, but their fees are separate from HomeUP's flat fee. Seller conveyancing is commonly $2,000 to $3,500 plus GST.",
  },
];

export const SELL_FAQ_LANDED: FaqItem[] = [
  {
    q: "Who is allowed to buy my landed property?",
    a: "Singapore citizens face the fewest restrictions. Permanent residents and foreigners generally need Land Dealings Approval Unit approval for most landed homes. Cluster or strata landed homes are sometimes more accessible to PRs. HomeUP factors eligibility into who we target for viewings.",
  },
  {
    q: "Why do landed sales often take longer than HDB or condo?",
    a: "The qualified buyer pool is smaller and each buyer's financing and eligibility checks take time. Marketing can run 4 to 16 weeks before a suitable offer. Legal completion after acceptance is often 24 to 32 weeks. HomeUP uses patient, targeted marketing rather than volume alone.",
  },
  {
    q: "Does freehold always sell faster than leasehold landed?",
    a: "Not automatically. Freehold and 999-year leasehold homes are often more attractive to long-term buyers, but an overpriced freehold home will sit longer than a fairly priced leasehold one. Tenure is one input in pricing, not a substitute for recent transaction data in your area.",
  },
  {
    q: "How do you price a landed home accurately?",
    a: "Landed value depends on plot size, shape, orientation, road frontage, tenure, and recent transacted prices nearby. HomeUP benchmarks against comparable sales and adjusts for those factors. We do not inflate the asking price to win the listing.",
  },
  {
    q: "Will HomeUP vet buyers before a viewing?",
    a: "Yes. For landed homes we check basic financial qualification and purchase eligibility before confirming a viewing. That protects your time and avoids walk-throughs from buyers who cannot complete.",
  },
  {
    q: "How does HomeUP handle negotiation on higher-value landed sales?",
    a: "We present each offer with a full read of terms, not just the headline price: payment schedule, completion date, and conditions. Landed deals need patience. We will not pressure you to accept before you are comfortable with the outcome.",
  },
];

export const BUY_FAQ_GENERAL: FaqItem[] = [
  {
    q: "Why is buyer representation free for condo and landed but not for HDB?",
    a: "For resale private property and new launch purchases, the seller or developer pays the buyer's agent under standard co-broke arrangements. HDB resale is different: buyer representation is a paid service, and HomeUP charges a fixed $1,999 plus GST. The fee is stated upfront before you commit.",
  },
  {
    q: "If representation is complimentary on private property, is the advice truly neutral?",
    a: "HomeUP is not paid more when you buy a more expensive unit on a standard co-broke deal. We still compare projects, flag risks, and shortlist based on your budget and timeline. Going direct to a developer's sales gallery means sales-led guidance. HomeUP's role is advisory.",
  },
  {
    q: "What does buyer representation include end to end?",
    a: "Affordability and financing guidance, shortlisting, viewing coordination, offer strategy, OTP and Sale and Purchase review, and documentation through to completion. For HDB, that also includes grant planning and resale checklist management.",
  },
  {
    q: "Can HomeUP help if I am selling and buying at the same time?",
    a: "Yes. We map sale proceeds, purchase budget, and loan position together from day one. That reduces the risk of a forced sale, a rushed purchase, or a gap between homes.",
  },
  {
    q: "How is HomeUP different from approaching a developer sales team directly?",
    a: "A developer team is paid to move units in that project. HomeUP compares across projects and stacks, highlights trade-offs, and helps you decide before showroom pressure peaks. On new launch day, that preparation matters.",
  },
];

export const BUY_FAQ_HDB: FaqItem[] = [
  {
    q: "Which CPF grants might apply to my HDB resale purchase?",
    a: "Eligibility depends on citizenship, income, and property history. Common grants include the Enhanced CPF Housing Grant (up to $80,000 for first-timers), the Family Grant ($50,000 for couples), and the Proximity Housing Grant ($30,000 when buying near parents). HomeUP reviews grant eligibility before you shortlist flats.",
  },
  {
    q: "Should I use an HDB loan or a bank loan for resale?",
    a: "HDB loans are currently 2.6% with up to 80% financing and a 20% down payment from cash or CPF. Bank loans often start lower but can move with the market, and usually require 25% down with at least 5% in cash. The right choice depends on your buffer, how long you plan to hold, and whether you may refinance later. We walk through both at the planning stage.",
  },
  {
    q: "Can I buy HDB resale if I still own private property?",
    a: "Not while you still own private residential property. You must dispose of it first and observe the 15-month wait before buying HDB resale. HomeUP flags eligibility constraints before you spend time on shortlisting.",
  },
  {
    q: "Does the HDB resale levy apply when I buy on the open market?",
    a: "The resale levy applies when you buy a second subsidised flat from HDB after selling a subsidised flat. It does not apply to open-market resale purchases. HomeUP confirms whether levy rules affect your specific situation.",
  },
  {
    q: "How long does an HDB resale purchase take after OTP?",
    a: "From exercised OTP to completion is often 16 to 20 weeks, including Resale Portal steps, grant processing, valuation, and the completion appointment. Time to find and secure an OTP depends on your budget discipline and competition in your preferred towns.",
  },
  {
    q: "Can I buy before my current home sells?",
    a: "Only if your finances support it. Some buyers can carry two loans or fund the purchase with cash. Most upgraders need sale proceeds and CPF returned from the sale they are exiting. HomeUP models cash flow early so you know the safest sequence.",
  },
];

export const BUY_FAQ_CONDO: FaqItem[] = [
  {
    q: "Do I pay HomeUP directly when buying resale condo or landed?",
    a: "No. On standard resale private property transactions, the buyer's agent fee is paid from the seller's side. You do not pay HomeUP for that representation.",
  },
  {
    q: "How much ABSD will I pay as a buyer?",
    a: "Singapore citizens pay 0% ABSD on a first property, 20% on a second, and 30% on a third and beyond. Permanent residents pay 5% on a first and 30% on later properties. Foreigners pay 60% on residential property. HomeUP builds ABSD into affordability before you make an offer.",
  },
  {
    q: "What should I check before making an offer on a resale condo?",
    a: "Outstanding seller mortgage, management fee or sinking fund arrears, existing tenancy and end dates, whether SSD limits the seller's flexibility, and recent transacted prices in the same development. HomeUP reviews these before advising you to offer.",
  },
  {
    q: "How do you align completion dates when I am selling and buying?",
    a: "Private completions are often 20 to 24 weeks from OTP. The goal is to line up sale proceeds with purchase deadlines, or negotiate deferred completion on one side. HomeUP coordinates both files so you are not committed to a purchase before sale proceeds are realistic.",
  },
  {
    q: "Resale condo or new launch: which fits my timeline?",
    a: "Resale lets you view the actual unit and move in sooner. New launch means buying off-plan with delivery often 3 to 5 years away and progressive payment during construction. HomeUP compares both against your hold period, budget, and urgency to move.",
  },
];

export const BUY_FAQ_NEW_LAUNCH: FaqItem[] = [
  {
    q: "How does balloting work on a popular new launch?",
    a: "Developers often register buyers before launch day and assign queue numbers by ballot. Your number sets when you enter the showflat to pick a unit. HomeUP helps you register early, shortlist stacks, and decide limits before time pressure hits on the day.",
  },
  {
    q: "How does the progressive payment schedule work?",
    a: "Payments follow construction milestones under the Progressive Payment Scheme. A common pattern is 5% on option and a further 15% within eight weeks of exercising the OTP, then staged payments through to Temporary Occupation Permit. You are not paying the full price on day one.",
  },
  {
    q: "Does HomeUP represent buyers on every new launch project?",
    a: "HomeUP has access to most major Singapore launches. On some projects we hold direct marketing appointments with earlier unit information. On others we still attend as your buyer's agent with independent analysis. The advice role does not change.",
  },
  {
    q: "When do I collect keys on a new launch purchase?",
    a: "At Temporary Occupation Permit, typically 3 to 5 years after launch depending on the build. After TOP you inspect the unit for defects (snagging) before key collection. HomeUP can help coordinate that process.",
  },
  {
    q: "How do I compare new launch projects without showroom bias?",
    a: "We weigh location, developer track record, price per square foot against nearby resale, floor plan efficiency, stack orientation, and future supply in the area. The goal is a side-by-side view you can act on, not a sales gallery pitch.",
  },
  {
    q: "What happens if I walk away after paying the option fee?",
    a: "If you do not exercise the OTP, you forfeit the option fee (commonly 5%). After exercise and signing the Sale and Purchase Agreement, backing out has serious legal and financial consequences. HomeUP ensures you understand terms and comparables before you sign.",
  },
];
