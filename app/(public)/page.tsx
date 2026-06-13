import { JsonLd } from "@/components/seo/JsonLd";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { BuyCta } from "@/components/sections/BuyCta";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { FixedFeeDefinition } from "@/components/sections/FixedFeeDefinition";
import { Hero } from "@/components/sections/Hero";
import { PropertyListings } from "@/components/sections/PropertyListings";
import { SocialPanel } from "@/components/sections/SocialPanel";
import { Testimonials } from "@/components/sections/Testimonials";
import PricingSection4 from "@/components/ui/pricing-section-4";
import { LastUpdated } from "@/components/ui/LastUpdated";
import { HOMEPAGE_FAQ } from "@/lib/seo/homepage";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  organizationSchema,
  SELL_HOW_TO_STEPS,
} from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Fixed-Fee Property Agents Singapore | HomeUP",
  description:
    "HomeUP helps Singapore homeowners sell for more with a transparent fixed fee — HDB from $1,999, Condo from $4,999. 1,000+ transactions closed by CEA-licensed agents.",
  path: "/",
});

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
      <JsonLd
        data={[
          organizationSchema(),
          faqSchema(HOMEPAGE_FAQ),
          howToSchema(
            "How to sell your property with HomeUP",
            "HomeUP's transparent 4-step process for selling your Singapore property at a fixed fee — no percentage commission, no hidden charges.",
            SELL_HOW_TO_STEPS,
          ),
          breadcrumbSchema([{ name: "Home", path: "/" }]),
        ]}
      />
      <Navbar />
      <main>
        <Hero />
        <FixedFeeDefinition />
        <PricingSection4 />
        <GreenDivider />
        <Testimonials />
        <GreenDivider />
        <PropertyListings />
        <GreenDivider />
        <BuyCta />
        <GreenDivider />
        <AgentProfiles />
        <SocialPanel />
        <CtaBanner />
        <LastUpdated className="pb-8" />
      </main>
      <Footer />
    </>
  );
}
