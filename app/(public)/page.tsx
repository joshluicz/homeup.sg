import { JsonLd } from "@/components/seo/JsonLd";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { BuyCta } from "@/components/sections/BuyCta";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Hero } from "@/components/sections/Hero";
import { HeroImagePreload } from "@/components/sections/HeroImagePreload";
import { PropertyListings } from "@/components/sections/PropertyListings";
import { SocialPanel } from "@/components/sections/SocialPanel";
import { FAQSection } from "@/components/sections/FAQSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { WhyCheaperTeaser } from "@/components/sections/WhyCheaperTeaser";
import PricingSection4 from "@/components/ui/pricing-section-4";
import { HOMEPAGE_FAQ, faqItemsForSchema } from "@/lib/data/faqs";
import { getActiveListingsServer, getListingStatsServer } from "@/lib/listings/server-queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  organizationSchema,
  SELL_HOW_TO_STEPS,
  speakableWebPageSchema,
  SPEAKABLE_HOMEPAGE_SELECTORS,
} from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Fixed-Fee Property Agents Singapore | HomeUP",
  description:
    "HomeUP helps Singapore homeowners sell for more with a transparent fixed fee: HDB from $1,999, Condo from $4,999. 1,000+ transactions closed by CEA-licensed agents.",
  path: "/",
});

/** Safety net: listing counts also bust via revalidateTag("listings") after sync. */
export const revalidate = 300;

export default async function Home() {
  const [stats, previewListings] = await Promise.all([
    getListingStatsServer(),
    getActiveListingsServer(6),
  ]);

  return (
    <>
      <HeroImagePreload />
      <JsonLd
        data={[
          organizationSchema(),
          faqSchema(faqItemsForSchema(HOMEPAGE_FAQ, stats.total)),
          howToSchema(
            "How to sell your property with HomeUP",
            "HomeUP's transparent 4-step process for selling your Singapore property at a fixed fee, with no percentage commission and no hidden charges.",
            SELL_HOW_TO_STEPS,
          ),
          breadcrumbSchema([{ name: "Home", path: "/" }]),
          speakableWebPageSchema({
            path: "/",
            name: "Fixed-Fee Property Agents Singapore | HomeUP",
            cssSelectors: SPEAKABLE_HOMEPAGE_SELECTORS,
          }),
        ]}
      />
      <Navbar />
      <main>
        <Hero />
        <WhyCheaperTeaser listingCount={stats.total} />
        <PricingSection4 />
        <Testimonials />
        <PropertyListings listingCount={stats.total} initialListings={previewListings} />
        <BuyCta />
        <AgentProfiles />
        <FAQSection
          items={HOMEPAGE_FAQ}
          listingCount={stats.total}
          eyebrow="Common questions"
          title="What homeowners ask before they list with us"
          lead="Straight answers on fees, incentives, and what you handle yourself. No textbook HDB basics."
          speakableAnswerCount={3}
          whatsappContext="faqHomepage"
        />
        <SocialPanel />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
