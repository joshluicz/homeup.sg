import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BuyLandingContent } from "@/components/sections/BuyLandingContent";
import { BUY_PAGE_GENERAL } from "@/lib/data/buy-pages";

const config = BUY_PAGE_GENERAL;

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://lp.homeup.sg/buy#service",
  name: "HomeUP Property Buying Services Singapore",
  description:
    "HomeUP provides full buyer representation for HDB, resale condo/landed, and new launch property purchases in Singapore. Complimentary for condo, landed, and new launch purchases. Fixed $1,999 fee for HDB.",
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
          "Full guidance through CPF grants, financing, and the HDB resale process.",
      },
      {
        "@type": "Offer",
        name: "Condo/Landed Purchase Representation",
        price: "0",
        priceCurrency: "SGD",
        description:
          "Complimentary buyer representation for resale condo and landed purchases.",
      },
      {
        "@type": "Offer",
        name: "New Launch Purchase Representation",
        price: "0",
        priceCurrency: "SGD",
        description:
          "Complimentary assistance to purchase New Launch straight from developers. Buyer pays no commission.",
      },
    ],
  },
};

export const metadata: Metadata = {
  title: config.meta.title,
  description: config.meta.description,
  alternates: { canonical: "https://lp.homeup.sg/buy" },
  openGraph: {
    url: "https://lp.homeup.sg/buy",
    title: `${config.meta.title} | HomeUP`,
    description: config.meta.description,
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
    title: `${config.meta.title} | HomeUP`,
    description: config.meta.description,
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
      <Navbar />
      <main className="bg-white">
        <BuyLandingContent config={config} showAwardsStrip />
      </main>
      <Footer />
    </>
  );
}
