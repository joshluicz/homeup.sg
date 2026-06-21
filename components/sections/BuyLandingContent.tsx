"use client";

import type { BuyPageConfig } from "@/lib/data/buy-pages";
import type { WhatsAppMessageKey } from "@/lib/whatsapp";
import {
  BUY_FAQ_CONDO,
  BUY_FAQ_GENERAL,
  BUY_FAQ_HDB,
  BUY_FAQ_NEW_LAUNCH,
} from "@/lib/data/faqs";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { BuyHero } from "@/components/sections/BuyHero";
import { BuySubPageHero } from "@/components/sections/BuySubPageHero";
import { BuyPricing } from "@/components/sections/BuyPricing";
import { BuyProcess } from "@/components/sections/BuyProcess";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { FAQSection } from "@/components/sections/FAQSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { BuyTeamAwards } from "@/components/ui/BuyTeamAwards";

const FAQ_WHATSAPP_BY_TYPE: Record<NonNullable<BuyPageConfig["filterType"]>, WhatsAppMessageKey> = {
  HDB: "faqBuyHdb",
  CondoLanded: "faqBuyCondo",
  NewLaunch: "faqBuyNewLaunch",
};

const FAQ_BY_TYPE = {
  HDB: {
    items: BUY_FAQ_HDB,
    eyebrow: "Buying HDB: common questions",
    title: "What HDB buyers ask us most",
    lead: "Grants, loan choice, sell-and-buy sequencing, and eligibility rules that actually change your budget.",
  },
  CondoLanded: {
    items: BUY_FAQ_CONDO,
    eyebrow: "Buying condo or landed: common questions",
    title: "What resale private property buyers ask us most",
    lead: "Additional Buyer's Stamp Duty (ABSD), buyer fees, sell-and-buy timing, and what to check before making an offer. Covered in full.",
  },
  NewLaunch: {
    items: BUY_FAQ_NEW_LAUNCH,
    eyebrow: "Buying new launch: common questions",
    title: "What new launch buyers ask us most",
    lead: "Balloting, progressive payment schedules, project comparisons, and what happens at Temporary Occupation Permit (TOP). Answered without the showroom spin.",
  },
};

const GENERAL_FAQ = {
  items: BUY_FAQ_GENERAL,
  eyebrow: "Common Questions",
  title: "What buyers ask us most",
  lead: "Complimentary representation, HDB fees, sell-and-buy coordination, and how HomeUP differs from going direct. Answered honestly.",
};

interface BuyLandingContentProps {
  config: BuyPageConfig;
  showAwardsStrip?: boolean;
}

export function BuyLandingContent({ config, showAwardsStrip = false }: BuyLandingContentProps) {
  const isGeneral = config.filterType === null;
  const faqConfig = config.filterType ? FAQ_BY_TYPE[config.filterType] : GENERAL_FAQ;
  const faqWhatsappContext: WhatsAppMessageKey = config.filterType
    ? FAQ_WHATSAPP_BY_TYPE[config.filterType]
    : "faqBuyGeneral";

  if (isGeneral) {
    // Main /buy page: doorway + general pitch
    return (
      <>
        <BuyHero content={config.hero} />
        {showAwardsStrip && <BuyTeamAwards strip />}
        <BuyPricing
          filterType={null}
          showLearnMore
          defaultSliderType={config.defaultSliderType}
          showServices
        />
        <BuyProcess propertyType={null} />
        <FAQSection
          items={faqConfig.items}
          eyebrow={faqConfig.eyebrow}
          title={faqConfig.title}
          lead={faqConfig.lead}
          whatsappContext={faqWhatsappContext}
        />
        <Testimonials />
        <AgentProfiles />
        <CtaBanner />
      </>
    );
  }

  // Sub-buy pages: jump straight into type-specific details
  return (
    <>
      <BuySubPageHero content={config.hero} filterType={config.filterType!} />
      <BuyProcess propertyType={config.filterType} />
      <FAQSection
        items={faqConfig.items}
        eyebrow={faqConfig.eyebrow}
        title={faqConfig.title}
        lead={faqConfig.lead}
        whatsappContext={faqWhatsappContext}
      />
      <Testimonials />
      <AgentProfiles />
      <CtaBanner />
    </>
  );
}
