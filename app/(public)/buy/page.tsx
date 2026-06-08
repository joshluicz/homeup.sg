import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BuyHero } from "@/components/sections/BuyHero";
import { BuyPricing } from "@/components/sections/BuyPricing";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { BuyTeamAwards } from "@/components/ui/BuyTeamAwards";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://lp.homeup.sg/buy#service",
  name: "HomeUP Property Buying Services Singapore",
  description:
    "HomeUP provides full buyer representation for HDB, resale condo, and landed property purchases in Singapore. Complimentary for condo and landed purchases. Fixed $1,999 fee for HDB. Services include financing guidance, unit shortlisting, negotiation support, and sell-and-buy coordination.",
  provider: {
    "@type": "RealEstateAgent",
    "@id": "https://lp.homeup.sg/#organization",
    name: "HomeUP",
  },
  areaServed: { "@type": "Country", name: "Singapore" },
  serviceType: "Buyer Representation",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "HomeUP Buying Packages",
    itemListElement: [
      {
        "@type": "Offer",
        name: "HDB Purchase Representation",
        price: "1999",
        priceCurrency: "SGD",
        description:
          "Full guidance through CPF grants, financing, and the HDB resale process. Includes affordability planning, unit shortlisting, negotiation, and OTP documentation.",
      },
      {
        "@type": "Offer",
        name: "Resale Condo Purchase Representation",
        price: "0",
        priceCurrency: "SGD",
        description:
          "Complimentary buyer representation for resale condo and EC purchases. Includes market analysis, project comparisons, viewing coordination, and negotiation support.",
      },
      {
        "@type": "Offer",
        name: "Landed Property Purchase Representation",
        price: "0",
        priceCurrency: "SGD",
        description:
          "Complimentary end-to-end representation for landed property purchases, including tenure checks, valuation guidance, and documentation.",
      },
    ],
  },
};

const buyFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is it free to use HomeUP as a buyer's agent in Singapore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HomeUP provides complimentary buyer representation for resale condo and landed property purchases — the fee is covered via standard co-broke arrangements. For HDB purchases, a fixed fee of $1,999 applies. There are no hidden charges.",
      },
    },
    {
      "@type": "Question",
      name: "What does HomeUP help buyers with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HomeUP helps buyers with the full purchase process: affordability and grant planning, HDB or condo unit shortlisting, viewing coordination, negotiation, OTP and documentation, and sell-and-buy timing coordination for upgraders.",
      },
    },
    {
      "@type": "Question",
      name: "Can HomeUP help me sell my current home and buy a new one at the same time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. HomeUP specialises in coordinated sell-and-buy planning, helping homeowners sequence both transactions to minimise financial risk, manage CPF and cash flow, and avoid owning two properties simultaneously where possible.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a buyer's agent cost in Singapore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For resale condo and landed purchases, buyer representation through HomeUP is complimentary — funded via co-broke arrangements. For HDB purchases, HomeUP charges a fixed $1,999 fee. Traditional agents typically charge 1% of the purchase price as a buyer's commission.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "Buy Property in Singapore",
  description:
    "Buy your next Singapore home with a coordinated HomeUP team. Complimentary representation for condo and landed purchases. HDB buying from $1,999. Expert financing, negotiation, and sell-and-buy planning.",
  alternates: { canonical: "https://lp.homeup.sg/buy" },
  openGraph: {
    url: "https://lp.homeup.sg/buy",
    title: "Buy Property in Singapore | HomeUP",
    description:
      "Complimentary buyer representation for condo and landed purchases. Fixed $1,999 for HDB. Financing, shortlisting, negotiation and sell-and-buy coordination.",
    images: [
      {
        url: "https://lp.homeup.sg/images/agent-tong-boon.png",
        width: 400,
        height: 400,
        alt: "Yeo Tong Boon — HomeUP Senior Property Advisor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Property in Singapore | HomeUP",
    description:
      "Complimentary for condo & landed. Fixed $1,999 for HDB. Expert guidance from financing to negotiation.",
    images: ["https://lp.homeup.sg/images/agent-tong-boon.png"],
  },
};

export default function BuyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buyFaqSchema) }}
      />
      <Navbar />
      <main className="bg-white">
        <BuyHero />
        <BuyTeamAwards strip />
        <BuyPricing />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
