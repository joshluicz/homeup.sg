"use client";

import type { SellPageConfig } from "@/lib/data/sell-pages";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { Benefits } from "@/components/sections/Benefits";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { SellFeeExplainer } from "@/components/sections/SellFeeExplainer";
import { SellHero } from "@/components/sections/SellHero";
import { SellProcess } from "@/components/sections/SellProcess";
import { SellTypeGuide } from "@/components/sections/SellTypeGuide";
import { SocialPanel } from "@/components/sections/SocialPanel";
import { Testimonials } from "@/components/sections/Testimonials";
import PricingSection4 from "@/components/ui/pricing-section-4";

interface SellLandingContentProps {
  config: SellPageConfig;
}

export function SellLandingContent({ config }: SellLandingContentProps) {
  return (
    <>
      <SellHero content={config.hero} />
      <PricingSection4
        id={config.filterType ? undefined : "pricing"}
        filterType={config.filterType}
        showLearnMore={config.filterType === null}
        defaultSliderType={config.defaultSliderType}
        showSlider
      />
      <SellFeeExplainer />
      <Benefits />
      <SellProcess propertyType={config.filterType} />
      <ComparisonTable />
      {config.typeGuide && <SellTypeGuide content={config.typeGuide} />}
      <Testimonials />
      <AgentProfiles />
      <SocialPanel />
      <CtaBanner />
    </>
  );
}
