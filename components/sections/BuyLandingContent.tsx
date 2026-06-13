"use client";

import type { BuyPageConfig } from "@/lib/data/buy-pages";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { BuyFeeExplainer } from "@/components/sections/BuyFeeExplainer";
import { BuyHero } from "@/components/sections/BuyHero";
import { BuyPricing } from "@/components/sections/BuyPricing";
import { BuyTypeGuide } from "@/components/sections/BuyTypeGuide";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Testimonials } from "@/components/sections/Testimonials";
import { BuyTeamAwards } from "@/components/ui/BuyTeamAwards";

interface BuyLandingContentProps {
  config: BuyPageConfig;
  showAwardsStrip?: boolean;
}

export function BuyLandingContent({ config, showAwardsStrip = false }: BuyLandingContentProps) {
  return (
    <>
      <BuyHero content={config.hero} />
      {showAwardsStrip && <BuyTeamAwards strip />}
      <BuyPricing
        filterType={config.filterType}
        showLearnMore={config.filterType === null}
        defaultSliderType={config.defaultSliderType}
        showServices={config.filterType === null}
      />
      <BuyFeeExplainer />
      {config.typeGuide && <BuyTypeGuide content={config.typeGuide} />}
      <Testimonials />
      <AgentProfiles />
      <CtaBanner />
    </>
  );
}
