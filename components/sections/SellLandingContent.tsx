"use client";

import type { SellPageConfig } from "@/lib/data/sell-pages";
import type { WhatsAppMessageKey } from "@/lib/whatsapp";
import {
  SELL_FAQ_CONDO,
  SELL_FAQ_GENERAL,
  SELL_FAQ_HDB,
  SELL_FAQ_LANDED,
} from "@/lib/data/faqs";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { Benefits } from "@/components/sections/Benefits";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { FAQSection } from "@/components/sections/FAQSection";
import { PropertyTypeNav } from "@/components/sections/PropertyTypeNav";
import { SellFeeExplainer } from "@/components/sections/SellFeeExplainer";
import { SellHero } from "@/components/sections/SellHero";
import { SellSubPageHero } from "@/components/sections/SellSubPageHero";
import { SellProcessFlow } from "@/components/sections/SellProcessFlow";
import { SellTypeGuide } from "@/components/sections/SellTypeGuide";
import { SocialPanel } from "@/components/sections/SocialPanel";
import { Testimonials } from "@/components/sections/Testimonials";
import { WhyCheaper } from "@/components/sections/WhyCheaper";
import PricingSection4 from "@/components/ui/pricing-section-4";

const FAQ_WHATSAPP_BY_TYPE: Record<NonNullable<SellPageConfig["filterType"]>, WhatsAppMessageKey> = {
  HDB: "faqSellHdb",
  Condo: "faqSellCondo",
  Landed: "faqSellLanded",
};

const FAQ_BY_TYPE = {
  HDB: {
    items: SELL_FAQ_HDB,
    eyebrow: "Selling HDB: common questions",
    title: "What HDB sellers ask us most",
    lead: "CPF refunds, valuation timing, sell-and-buy dates, and pricing discipline. Practical answers before you commit to a sale.",
  },
  Condo: {
    items: SELL_FAQ_CONDO,
    eyebrow: "Selling condo: common questions",
    title: "What condo sellers ask us most",
    lead: "SSD, legal timelines, EC rules, and what happens between OTP and completion. Answered clearly.",
  },
  Landed: {
    items: SELL_FAQ_LANDED,
    eyebrow: "Selling landed: common questions",
    title: "What landed sellers ask us most",
    lead: "Buyer eligibility, tenure differences, valuation, and why patience matters in a landed sale. Answered honestly.",
  },
};

const GENERAL_FAQ = {
  items: SELL_FAQ_GENERAL,
  eyebrow: "Common Questions",
  title: "What sellers ask us most",
  lead: "Everything you need to know before deciding to sell with HomeUP: fees, process, viewings, and timelines.",
};

interface SellLandingContentProps {
  config: SellPageConfig;
  listingCount?: number;
}

export function SellLandingContent({ config, listingCount }: SellLandingContentProps) {
  const isGeneral = config.filterType === null;
  const faqConfig = config.filterType ? FAQ_BY_TYPE[config.filterType] : GENERAL_FAQ;
  const faqWhatsappContext: WhatsAppMessageKey = config.filterType
    ? FAQ_WHATSAPP_BY_TYPE[config.filterType]
    : "faqSellGeneral";

  if (isGeneral) {
    // Main /sell page: doorway + general pitch
    return (
      <>
        <SellHero content={config.hero} />
        <WhyCheaper />
        <PropertyTypeNav mode="sell" />
        <PricingSection4
          id="pricing"
          filterType={null}
          showLearnMore
          defaultSliderType={config.defaultSliderType}
          showSlider
        />
        <SellFeeExplainer />
        <Benefits />
        <ComparisonTable />
        <FAQSection
          items={faqConfig.items}
          listingCount={listingCount}
          eyebrow={faqConfig.eyebrow}
          title={faqConfig.title}
          lead={faqConfig.lead}
          whatsappContext={faqWhatsappContext}
        />
        <Testimonials />
        <AgentProfiles />
        <SocialPanel />
        <CtaBanner />
      </>
    );
  }

  // Sub-sell pages: jump straight into type-specific details
  return (
    <>
      <SellSubPageHero content={config.hero} filterType={config.filterType!} />
      <SellFeeExplainer />
      <SellProcessFlow propertyType={config.filterType!} />
      <ComparisonTable />
      {config.typeGuide && <SellTypeGuide content={config.typeGuide} />}
      <FAQSection
        items={faqConfig.items}
        eyebrow={faqConfig.eyebrow}
        title={faqConfig.title}
        lead={faqConfig.lead}
        whatsappContext={faqWhatsappContext}
      />
      <Testimonials />
      <AgentProfiles />
      <SocialPanel />
      <CtaBanner />
    </>
  );
}
