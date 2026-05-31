import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { BuyCta } from "@/components/sections/BuyCta";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Hero } from "@/components/sections/Hero";
import { PropertyListings } from "@/components/sections/PropertyListings";
import { Testimonials } from "@/components/sections/Testimonials";
import PricingSection4 from "@/components/ui/pricing-section-4";

function GreenDivider() {
  return (
    <div
      aria-hidden="true"
      className="h-16 bg-gradient-to-b from-primary-50/60 to-white"
    />
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PricingSection4 />
        <GreenDivider />
        <Testimonials />
        <GreenDivider />
        <PropertyListings />
        <GreenDivider />
        <AgentProfiles />
        <GreenDivider />
        <BuyCta />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
