/**
 * Singapore property knowledge base.
 * Injected into prompts to ground Claude in accurate local rules.
 * Update whenever MAS/HDB/CPF Board rules change.
 */
export const SG_FACTS = {
  glossary: {
    HDB: "Housing & Development Board — Singapore's public housing authority",
    BTO: "Build-To-Order — new HDB flats balloted directly from HDB",
    MOP: "Minimum Occupation Period — 5 years before an HDB flat can be sold on the open market",
    COV: "Cash-Over-Valuation — the cash premium paid above HDB's assessed value in resale transactions",
    ABSD: "Additional Buyer's Stamp Duty — extra tax on property purchases beyond the first",
    CPF: "Central Provident Fund — Singapore's mandatory savings scheme; CPF OA savings can be used for property",
    OTP: "Option to Purchase — the legal agreement giving a buyer 21 days to exercise and purchase a property",
    TDSR: "Total Debt Servicing Ratio — a borrower's total monthly debt obligations must not exceed 55% of gross monthly income",
    MSR: "Mortgage Servicing Ratio — for HDB loans, monthly repayment must not exceed 30% of gross monthly income",
    EC: "Executive Condominium — a public-private hybrid that becomes fully privatised after 10 years",
    TOP: "Temporary Occupation Permit — the certificate that allows residents to move into a new development",
    SSD: "Seller's Stamp Duty — imposed if a private property is sold within 3 years of purchase",
    LTV: "Loan-To-Value — maximum loan amount as a percentage of property value (75% for first property with bank loan)",
    PR: "Permanent Resident — eligible to buy resale HDB flats (not BTO) with conditions",
    SC: "Singapore Citizen — eligible for all property types including BTO",
  },

  absd2024: {
    singaporeCitizen: {
      first: "0%",
      second: "20%",
      third: "30%",
    },
    permanentResident: {
      first: "5%",
      second: "30%",
      third: "35%",
    },
    foreigner: "60% on all purchases",
    note: "Rates effective from 27 Apr 2023. Verify current rates at iras.gov.sg.",
  },

  bsd: {
    schedule: [
      { upTo: 180000, rate: "1%" },
      { upTo: 360000, rate: "2%" },
      { upTo: 1000000, rate: "3%" },
      { upTo: 1500000, rate: "4%" },
      { above: 1500000, rate: "5% on remainder; 6% above $3M" },
    ],
    note: "Buyer's Stamp Duty applies to all property purchases in Singapore.",
  },

  hdbLoan: {
    maxLtv: "80%",
    interestRate: "2.6% per annum (pegged to CPF OA rate + 0.1%)",
    maxLoanAge: "65 years or 25 years, whichever is shorter for remaining loan tenure",
    note: "HDB concessionary loan requires at least one buyer to be a Singapore Citizen.",
  },

  bankLoan: {
    maxLtv: "75% (first property, no outstanding loans)",
    stressTestRate: "Banks apply TDSR stress test; effective floor rate often used is 4%",
    note: "Private property buyers must use bank loans; HDB sellers upgrading to private typically use bank loans.",
  },

  mop: {
    standard: "5 years from key collection for BTO / resale HDB before selling",
    afterMop: [
      "Can sell on open market (resale HDB)",
      "Can rent out entire flat",
      "Can buy private property (but must pay ABSD if married citizen pair already owns 1 property)",
    ],
  },

  upgraderPath: {
    summary:
      "HDB owner (post-MOP) → sell HDB → use net proceeds (sale price minus outstanding loan, CPF refund with accrued interest, agent fees, legal fees) → buy private condo/EC",
    keyRisk:
      "Negative cash proceeds if CPF accrued interest + outstanding loan exceeds sale price. Common for older BTO bought at grant price.",
  },

  ceaRules: {
    mustNotSay: [
      "guaranteed returns or rental yields",
      "prices will definitely go up / never go down",
      "act now or miss out (false urgency)",
      "misleading comparisons without basis",
    ],
    mustInclude: [
      "past performance is not a guarantee of future results (for investment claims)",
      "readers should seek independent advice for their specific situation",
    ],
  },
} as const;
