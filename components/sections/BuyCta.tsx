"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { BuyTeamAwards } from "@/components/ui/BuyTeamAwards";
import { FadeInUp } from "@/components/ui/motion-primitives";
import { BuyHeroPanel } from "@/components/sections/BuyHeroPanel";

export function BuyCta() {
  return (
    <section aria-label="Buying services" className="bg-neutral-50 section-padding">
      <div className="container-page">
        <FadeInUp>
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="grid items-stretch gap-0 lg:grid-cols-2">
              {/* Copy */}
              <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                <Eyebrow>Looking to Buy?</Eyebrow>
                <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-3xl">
                  Know what you&apos;re buying before you make your move
                </h2>
                <p className="mt-4 text-sm font-normal leading-relaxed text-neutral-600">
                  Our award-winning team will guide you through your buying process.
                </p>

                <Link
                  href="/buy"
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                >
                  Explore Buying Services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Photo */}
              <div className="relative min-h-[240px] lg:min-h-0">
                <BuyHeroPanel className="rounded-none" fillContainer />
              </div>
            </div>

            <BuyTeamAwards compact className="rounded-b-3xl" />
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
