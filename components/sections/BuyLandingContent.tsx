"use client";

import type { BuyPageConfig } from "@/lib/data/buy-pages";
import {
  BUY_FAQ_CONDO,
  BUY_FAQ_GENERAL,
  BUY_FAQ_HDB,
  BUY_FAQ_NEW_LAUNCH,
} from "@/lib/data/faqs";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { BuyFeeExplainer } from "@/components/sections/BuyFeeExplainer";
import { BuyHero } from "@/components/sections/BuyHero";
import { BuySubPageHero } from "@/components/sections/BuySubPageHero";
import { BuyPricing } from "@/components/sections/BuyPricing";
import { BuyProcess } from "@/components/sections/BuyProcess";
import { BuyTypeGuide } from "@/components/sections/BuyTypeGuide";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { FAQSection } from "@/components/sections/FAQSection";
import { PropertyTypeNav } from "@/components/sections/PropertyTypeNav";
import { Testimonials } from "@/components/sections/Testimonials";
import { BuyTeamAwards } from "@/components/ui/BuyTeamAwards";

const FAQ_BY_TYPE = {
  HDB: {
    items: BUY_FAQ_HDB,
    eyebrow: "Buying HDB — Common Questions",
    title: "What HDB buyers ask us most",
    lead: "Grants, loan eligibility, MOP implications, and how to sequence a sell-and-buy — answered clearly before you commit.",
  },
  CondoLanded: {
    items: BUY_FAQ_CONDO,
    eyebrow: "Buying Condo or Landed — Common Questions",
    title: "What resale private property buyers ask us most",
    lead: "ABSD, buyer fees, sell-and-buy timing, and what to check before making an offer — covered in full.",
  },
  NewLaunch: {
    items: BUY_FAQ_NEW_LAUNCH,
    eyebrow: "Buying New Launch — Common Questions",
    title: "What new launch buyers ask us most",
    lead: "Balloting, progressive payment schedules, project comparisons, and what happens at TOP — answered without the showroom spin.",
  },
};

const GENERAL_FAQ = {
  items: BUY_FAQ_GENERAL,
  eyebrow: "Common Questions",
  title: "What buyers ask us most",
  lead: "Complimentary representation, HDB fees, sell-and-buy coordination, and how HomeUP differs from going direct — answered honestly.",
};

interface BuyLandingContentProps {
  config: BuyPageConfig;
  showAwardsStrip?: boolean;
}

export function BuyLandingContent({ config, showAwardsStrip = false }: BuyLandingContentProps) {
  const isGeneral = config.filterType === null;
  const faqConfig = config.filterType ? FAQ_BY_TYPE[config.filterType] : GENERAL_FAQ;

  if (isGeneral) {
    // Main /buy page: doorway + general pitch
    return (
      <>
        <BuyHero content={config.hero} />
        {showAwardsStrip && <BuyTeamAwards strip />}
        <PropertyTypeNav mode="buy" />
        <BuyPricing
          filterType={null}
          showLearnMore
          defaultSliderType={config.defaultSliderType}
          showServices
        />
        <BuyFeeExplainer />
        <BuyProcess propertyType={null} />
        <FAQSection
          items={faqConfig.items}
          eyebrow={faqConfig.eyebrow}
          title={faqConfig.title}
          lead={faqConfig.lead}
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
      <BuyFeeExplainer />
      <BuyProcess propertyType={config.filterType} />
      {config.typeGuide && <BuyTypeGuide content={config.typeGuide} />}
      <FAQSection
        items={faqConfig.items}
        eyebrow={faqConfig.eyebrow}
        title={faqConfig.title}
        lead={faqConfig.lead}
      />
      <Testimonials />
      <AgentProfiles />
      <CtaBanner />
    </>
  );
}
