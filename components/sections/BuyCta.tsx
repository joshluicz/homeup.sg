"use client";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";

const points = [
  "Understand your affordability & financing",
  "Compare HDB, resale condo & new launch options",
  "Negotiate and secure the right price",
  "Coordinate selling & buying seamlessly",
];

export function BuyCta() {
  return (
    <section aria-label="Buying services" className="bg-neutral-50 section-padding">
      <div className="container-page">
        <FadeInUp>
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="grid items-center gap-0 lg:grid-cols-2">
              {/* Copy */}
              <div className="p-8 sm:p-10 lg:p-12">
                <Eyebrow>Looking to Buy?</Eyebrow>
                <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-3xl">
                  Know what you&apos;re buying before you make your move
                </h2>
                <p className="mt-4 text-sm font-normal leading-relaxed text-neutral-600">
                  Whether it&apos;s your first HDB, a resale condo upgrade, or a new launch,
                  the right strategy saves you time, money and costly mistakes. Our dedicated
                  buying team — led by Tong Boon, one of his agency&apos;s top private residential
                  transactors — guides you through every stage with confidence.
                </p>

                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm font-normal text-neutral-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/buy"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                >
                  Explore Buying Services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Accent panel */}
              <div className="relative hidden h-full min-h-[320px] bg-gradient-to-br from-primary-600 to-primary-800 lg:block">
                <div className="absolute inset-0 flex flex-col justify-center gap-6 p-12 text-white">
                  <p className="font-display text-4xl font-extrabold leading-tight">
                    Flexible packages<br />for every buyer
                  </p>
                  <p className="max-w-sm text-sm font-normal leading-relaxed text-primary-50">
                    From first-time homebuyers to HDB upgraders and seasoned investors —
                    guidance, sell-and-buy coordination, or full end-to-end representation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
