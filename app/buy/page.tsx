import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BuyHero } from "@/components/sections/BuyHero";
import { BuyPricing } from "@/components/sections/BuyPricing";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { BuyTeamAwards } from "@/components/ui/BuyTeamAwards";

export const metadata: Metadata = {
  title: "Buying Services | HomeUP",
  description:
    "Buy your next home with a coordinated HomeUP team: financing, market analysis, negotiation and sell-and-buy planning with transparent fees.",
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
