"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";
import { ListingCount } from "@/components/listings/ListingCount";

export function WhyCheaperTeaser() {
  return (
    <section
      aria-label="Why HomeUP fees are lower"
      className="border-y border-primary-100 bg-primary-50/70"
    >
      <div className="container-page py-10 sm:py-12">
        <FadeInUp className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Fixed fees</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.75rem)] font-extrabold leading-tight tracking-tight text-neutral-900">
              Why are we cheaper than typical agents?
            </h2>
            <p className="mt-3 text-sm font-normal leading-relaxed text-neutral-600">
              HomeUP runs at scale with <ListingCount suffix=" active listings" />. You host viewings at home
              while we handle buyer screening, marketing, and paperwork. Less overhead
              means a fixed fee instead of 2% commission.
            </p>
          </div>
          <Button size="lg" asChild className="shrink-0">
            <Link href="/sell#why-cheaper" className="gap-2">
              See how it works
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </FadeInUp>
      </div>
    </section>
  );
}
