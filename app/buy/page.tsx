import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BuyHero } from "@/components/sections/BuyHero";
import { BuyPricing } from "@/components/sections/BuyPricing";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { BuyTeamAwards } from "@/components/ui/BuyTeamAwards";

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
