"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";

export function PlaybookHero() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 pb-7 pt-16 text-white sm:pb-8 sm:pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,154,68,0.25),transparent)]"
      />

      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Playbook</Eyebrow>

          <h1 className="mt-4 font-display text-display-sm font-extrabold tracking-tight sm:text-display-md">
            Unlimited Tips
            <span className="mt-3 block text-lg font-semibold leading-relaxed text-primary-400 sm:mt-4 sm:text-xl">
              <span className="mt-1 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4">
                <span>Buyers</span>
                <span aria-hidden="true" className="text-white">
                  ·
                </span>
                <span>Sellers</span>
                <span aria-hidden="true" className="text-white">
                  ·
                </span>
                <span>Investors</span>
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
            Selling, buying, or just keeping up with the market? The videos and
            guides are sorted so you can find what fits your situation.
          </p>
        </div>
      </div>
    </section>
  );
}
