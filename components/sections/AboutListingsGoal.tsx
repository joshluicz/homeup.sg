"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { ListingCount } from "@/components/listings/ListingCount";
import { BackgroundPathsLayer } from "@/components/ui/background-paths";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";

export const ACTIVE_LISTINGS_GOAL = 400;

const COUNT_FALLBACK = 120;

function AnimatedGoalNumber({
  listingCount,
  goal,
}: {
  listingCount?: number;
  goal: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const display =
    listingCount != null ? listingCount.toLocaleString("en-SG") : `${COUNT_FALLBACK}+`;
  const goalDisplay = goal.toLocaleString("en-SG");

  return (
    <div className="mt-4 flex items-end gap-2">
      <p
        className="font-display text-[clamp(3.75rem,14vw,5.75rem)] font-extrabold leading-none tabular-nums tracking-tight text-white"
        aria-live="polite"
      >
        {prefersReducedMotion ? (
          <ListingCount
            initialCount={listingCount}
            fallback={`${COUNT_FALLBACK}+`}
            className="text-white"
          />
        ) : (
          <span className="inline-flex">
            {display.split("").map((char, index) => (
              <motion.span
                key={`${char}-${index}`}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: index * 0.04,
                  type: "spring",
                  stiffness: 180,
                  damping: 22,
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </span>
        )}
      </p>
      <p className="mb-1.5 font-display text-2xl font-bold tabular-nums text-neutral-500 sm:mb-2 sm:text-3xl">
        {prefersReducedMotion ? (
          `/ ${goalDisplay}`
        ) : (
          <>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block"
            >
              /
            </motion.span>{" "}
            {goalDisplay.split("").map((char, index) => (
              <motion.span
                key={`goal-${char}-${index}`}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.24 + index * 0.03,
                  type: "spring",
                  stiffness: 180,
                  damping: 22,
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </>
        )}
      </p>
    </div>
  );
}

type AboutListingsGoalProps = {
  listingCount?: number;
  asOfDate?: string;
};

function formatAsOfDate(date: Date): string {
  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AboutListingsGoal({ listingCount, asOfDate }: AboutListingsGoalProps) {
  const prefersReducedMotion = useReducedMotion();
  const effectiveCount = listingCount ?? COUNT_FALLBACK;
  const progressPct = Math.min(
    100,
    Math.round((effectiveCount / ACTIVE_LISTINGS_GOAL) * 100),
  );
  const remaining = Math.max(0, ACTIVE_LISTINGS_GOAL - effectiveCount);
  const dateLabel = asOfDate ?? formatAsOfDate(new Date());

  return (
    <section aria-label="Active listings goal" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp>
          <div className="relative overflow-hidden rounded-3xl border border-primary-600/25 bg-neutral-950 px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
            <BackgroundPathsLayer strokeClassName="text-primary-500/70" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,154,68,0.14)_0%,transparent_42%,rgba(255,255,255,0.04)_100%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-600/20 blur-3xl sm:h-72 sm:w-72"
            />

            <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-center lg:gap-16">
              <div className="min-w-0">
                <Eyebrow className="text-primary-400">Our ambition</Eyebrow>
                <h2 className="font-display text-[clamp(1.875rem,5.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight text-white">
                  Building toward{" "}
                  <span className="text-primary-400">{ACTIVE_LISTINGS_GOAL} active listings</span>
                </h2>
                <p className="mt-5 max-w-xl text-base font-normal leading-relaxed text-neutral-400">
                  More homes on HomeUP means stronger buyer reach, shared marketing power, and fixed
                  fees that stay low. We&apos;re scaling deliberately.
                </p>
                <Link
                  href="/listings"
                  className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary-500/40 bg-primary-600/10 px-5 py-2.5 text-sm font-semibold text-primary-300 transition-colors duration-200 hover:border-primary-400 hover:bg-primary-600/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
                >
                  Browse active listings
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
                <div className="relative overflow-hidden rounded-xl">
                  <BackgroundPathsLayer
                    className="opacity-60"
                    strokeClassName="text-primary-300/80"
                  />
                  <div className="relative z-10 px-0.5">
                    <div className="flex items-center gap-2 pl-1">
                      <TrendingUp
                        className="h-4 w-4 shrink-0 text-primary-400"
                        aria-hidden="true"
                      />
                      <p className="text-xs font-semibold text-neutral-400">
                        Live today
                        <span className="font-normal text-neutral-500"> · {dateLabel}</span>
                      </p>
                    </div>

                    <AnimatedGoalNumber listingCount={listingCount} goal={ACTIVE_LISTINGS_GOAL} />

                    <p className="mt-1 text-sm font-semibold text-primary-300">active listings</p>

                    <div className="mt-8">
                      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-neutral-400">
                        <span>{progressPct}% of goal</span>
                        <span>{remaining.toLocaleString("en-SG")} to go</span>
                      </div>
                      <div
                        className="mt-2.5 h-3 overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-valuenow={progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${progressPct}% progress toward ${ACTIVE_LISTINGS_GOAL} active listings`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-700 via-primary-500 to-primary-400"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
