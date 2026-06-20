export type ListingCountFaqVariant = "hosting-scale" | "shared-marketing";

export interface FaqItem {
  q: string;
  a: string;
  listingCountVariant?: ListingCountFaqVariant;
}

export function faqAnswerWithListingCount(
  variant: ListingCountFaqVariant,
  count: number,
): string {
  switch (variant) {
    case "hosting-scale":
      return `We keep costs down in two ways. You host viewings at your home, and we have ${count} homes listed at once so marketing work is shared. Your CEA-licensed advisor still handles pricing, negotiation, paperwork, and timeline planning.`;
    case "shared-marketing":
      return `We have ${count} homes listed at once, so listing and marketing work is shared. Sellers host their own viewings, so your advisor does not travel to every showing. We also run without a large traditional office setup. Those savings show up as a fixed fee instead of a 2% commission.`;
  }
}

export function faqItemsForSchema(items: FaqItem[], listingCount?: number): FaqItem[] {
  if (listingCount == null) return items;
  return items.map((item) =>
    item.listingCountVariant
      ? { ...item, a: faqAnswerWithListingCount(item.listingCountVariant, listingCount) }
      : item,
  );
}

export const HOMEPAGE_FAQ: FaqItem[] = [
  {
    q: "Why is HomeUP's fee so much lower if the service is full?",
    listingCountVariant: "hosting-scale",
    a: faqAnswerWithListingCount("hosting-scale", 120),
  },
  {
    q: "Does a fixed fee mean my agent cares less about my sale price?",
    a: "Not at all. HomeUP advisors are motivated by reputation and repeat business, not a percentage of your sale. In fact, commission-based agents can cut both ways: they may hold out for a higher price to earn a bigger cut, or quietly pressure you to accept a low offer after a month of viewings simply because repeated trips to your unit eat into their time. Either way, their advice follows their schedule and their paycheck. HomeUP advisors have no reason to rush you into a low offer. The owner will decide to accept or reject whatever offers that come to us.",
  },
  {
    q: "What do I handle myself compared with a traditional listing?",
    a: "You host viewings at your home. HomeUP screens enquiries, sends you serious buyers, and handles the listing, portal marketing, offers, negotiation, and paperwork. If you cannot host viewings, tell your advisor early so you can work out another plan.",
  },
  {
    q: "Are HomeUP Property Advisors Licensed Real Estate Agents in Singapore?",
    a: "HomeUP is a division of agents under a Singapore-licensed real estate agency, C & H Properties (L3007139C) All our advisors are CEA registered property agents in Singapore.",
  },
  {
    q: "Can HomeUP coordinate a sale and a purchase at the same time?",
    a: "Yes. Many families sell and buy at the same time. We plan your sale timeline, purchase budget, and loan position from the first meeting so you are not stuck accepting a bad offer or rushing a purchase because the dates do not match.",
  },
  {
    q: "If my home sells for well above $500,000, do I still pay the same fixed fee?",
    a: "Yes. HDB is $1,999, condo and EC is $4,999, and landed is $9,999, each plus GST. The fee does not change with your sale price. You know the number before you sign.",
  },
  {
    q: "How is HomeUP different from a typical 2% commission agent in practice?",
    a: "The biggest difference is viewings. Traditional agents accompany every buyer in person, so to protect their time, they may consolidate requests into one viewing slot a week. A keen buyer on Tuesday waits until Saturday — and often moves on. With HomeUP, you host viewings whenever a buyer is ready. More viewings, more offers, more negotiating power. Our advisors handle the important parts (marketing, negotiations and paperwork); you just need to open the door for buyers to view.",
  },
];

export const SELL_FAQ_GENERAL: FaqItem[] = [
  {
    q: "What is included in HomeUP's fixed fee?",
    a: "The fee is $1,999 for HDB, $4,999 for condo or EC, and $9,999 for landed, each plus GST. It covers listing on major portals, marketing, buyer screening, viewing coordination, negotiation, and sales paperwork through to completion. There is no success fee and no percentage of your sale price.",
  },
  {
    q: "Why is HomeUP's fee lower than a traditional agent?",
    listingCountVariant: "shared-marketing",
    a: faqAnswerWithListingCount("shared-marketing", 120),
  },
  {
    q: "How many viewings should I expect to host?",
    a: "It depends on price and demand. Many sellers host 5 to 15 viewings before accepting an offer. HomeUP screens enquiries first, so most visitors are serious buyers. Your advisor will tell you what to expect before each session.",
  },
  {
    q: "Can I sell and buy at the same time with HomeUP?",
    a: "Yes. We plan your sale timeline, purchase budget, and loan from the first meeting. That helps you avoid accepting the wrong offer or rushing a purchase because the dates were never aligned.",
  },
  {
    q: "What if I cannot find my next home before my sale completes?",
    a: "This comes up often. We plan for it early: realistic buying timelines alongside your sale, and sometimes a longer completion date with the buyer. We will not push you to accept an offer before your next move is sorted.",
  },
  {
    q: "How long does selling typically take after I accept an offer?",
    a: "HDB resales often take 16 to 20 weeks from accepted offer to completion because of HDB Portal steps. Condos often take 20 to 24 weeks. Landed can take 24 to 32 weeks because the buyer pool is smaller and legal checks take longer. Time on market before an offer depends on price and demand.",
  },
];

export const SELL_FAQ_HDB: FaqItem[] = [
  {
    q: "How much CPF must I return when I sell my HDB flat?",
    a: "CPF used to buy the flat, plus accrued interest at 2.5% per year, goes back to your CPF Ordinary Account when you sell. If needed, HomeUP estimates your net proceeds in the first meeting so you know how much cash you will receive.",
  },
  {
    q: "How long does an HDB resale take from accepted offer to completion?",
    a: "Most resales take 3-4 months after you accept an offer. That covers the 21-day option period, HDB Resale Portal submission, HDB approval, and completion at HDB Hub. How long you wait for a suitable offer depends on price and demand in your town.",
  },
  {
    q: "Does HomeUP handle the HDB Resale Portal submission?",
    a: "Yes. After the OTP is signed and the option fee is paid, HomeUP prepares the paperwork and submits through the HDB Resale Portal for you.",
  },
  {
    q: "When is the HDB valuation done and why does it matter?",
    a: "After the HDB is optioned out, the buyer will request for a valuation report from HDB. It affects the buyer's loan and CPF usage, which can affect whether the deal goes through at your agreed price.",
  },
  {
    q: "What if I need to buy my next home after my HDB sale?",
    a: "We plan your sale and purchase timeline from the start. We will touch on important points like whether you need an extension of stay and your current housing situation. We will not rush you into an offer that leaves you without a plan for your next home.",
  },
  {
    q: "Are there any other hidden fees?",
    a: "No, there are no hidden fees. The price is fixed at $1,999 + GST.",
  },
];

export const SELL_FAQ_CONDO: FaqItem[] = [
  {
    q: "How much CPF must I return when I sell my condo?",
    a: "CPF used to buy the unit, plus accrued interest at 2.5% per year, goes back to your CPF Ordinary Account when you sell. If needed, HomeUP estimates your net proceeds in the first meeting so you know how much cash you will receive.",
  },
  {
    q: "How long does a condo resale take from accepted offer to completion?",
    a: "Most resales take 3-4 months after you accept an offer. That covers the OTP period, Sale and Purchase Agreement, loan approval, and legal completion. How long you wait for a suitable offer depends on price and demand in your development.",
  },
  {
    q: "Does HomeUP handle the Sale and Purchase paperwork?",
    a: "Yes. After the OTP is signed and the option fee is paid, HomeUP prepares the paperwork and coordinates with both solicitors through completion for you.",
  },
  {
    q: "When is the bank valuation done and why does it matter?",
    a: "After the unit is optioned out, the buyer will request a valuation report from the bank. It affects the buyer's loan and CPF usage, which can affect whether the deal goes through at your agreed price.",
  },
  {
    q: "What if I need to buy my next home after my condo sale?",
    a: "We plan your sale and purchase timeline from the start. We will touch on important points like whether you need an extension of stay and your current housing situation. We will not rush you into an offer that leaves you without a plan for your next home.",
  },
  {
    q: "Are there any other hidden fees?",
    a: "No, there are no hidden fees. The price is fixed at $4,999 + GST.",
  },
  {
    q: "Does Seller's Stamp Duty apply to my condo sale?",
    a: "SSD applies if you sell within three years of purchase. Rates are 12% within one year, 8% within two years, and 4% within three years, based on the higher of sale price or market value. HomeUP confirms whether SSD applies in your first meeting before any listing date is set.",
  },
  {
    q: "Can I sell an Executive Condominium on the open market?",
    a: "After the five-year Minimum Occupation Period, an EC can be sold on the open market like a private condo. Before MOP, resale is back to HDB only. After privatisation (typically ten years), foreign buyers may also be eligible. HomeUP confirms your status before marketing begins.",
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
    a: "The qualified buyer pool is smaller and each buyer's financing and eligibility checks take time. Marketing can run 4 to 16 weeks before a suitable offer. Legal completion after acceptance is often 24 to 32 weeks. HomeUP uses targeted marketing rather than volume alone.",
  },
  {
    q: "Does freehold always sell faster than leasehold landed?",
    a: "Not always. Freehold and 999-year leasehold homes often appeal to long-term buyers, but an overpriced freehold home will sit longer than a fairly priced leasehold one. Tenure is one factor in pricing, not a substitute for recent sales data in your area.",
  },
  {
    q: "How do you price a landed home accurately?",
    a: "Landed value depends on plot size, shape, orientation, road frontage, tenure, and recent sales nearby. HomeUP benchmarks against comparable sales and adjusts for those factors. We do not inflate the asking price to win the listing.",
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
    a: "Affordability and financing guidance, shortlisting, viewing coordination, offer strategy, OTP and Sale and Purchase review, and paperwork through to completion. For HDB, that also includes grant planning and resale checklist management.",
  },
  {
    q: "Can HomeUP help if I am selling and buying at the same time?",
    a: "Yes. We plan sale proceeds, purchase budget, and loan position from day one. That reduces the risk of a forced sale, a rushed purchase, or a gap between homes.",
  },
  {
    q: "How is HomeUP different from approaching a developer sales team directly?",
    a: "A developer team is paid to sell units in that project. HomeUP compares across projects and stacks, highlights trade-offs, and helps you decide before showroom pressure peaks. On new launch day, that preparation matters.",
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
    a: "From exercised OTP to completion is often 16 to 20 weeks, including Resale Portal steps, grant processing, valuation, and the completion appointment. Time to find and secure an OTP depends on your budget and competition in your preferred towns.",
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
