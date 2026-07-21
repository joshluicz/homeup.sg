"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { AGENTS } from "@/lib/data/agents";
import { HOMEUP_TESTIMONIALS } from "@/lib/data/testimonials";
import { CEA_LICENSE, LEGAL_NAME, PARENT_ORG_NAME, PARENT_ORG_UEN } from "@/lib/seo/constants";
import { CredentialCounter } from "./CredentialCounter";
import { FeeComparison } from "./FeeComparison";

const CEA_REGISTER = "https://www.cea.gov.sg/aceas/public-register/";

const JOURNEY = [
  ["Understand", "We start with your situation — timeline, finances, and what moving actually needs to achieve."],
  ["Analyse", "We study your property against real transaction data, not a gut-feel valuation."],
  ["Position", "We set the strategy: pricing, timing, and who the buyer for this home really is."],
  ["Market", "Your home goes out across PropertyGuru, SRX, 99.co and HomeUP.sg, plus our own channels."],
  ["Negotiate", "We handle offers and counter-offers, and tell you plainly when one is worth taking."],
  ["Complete", "Paperwork, timelines and completion — coordinated through to handover."],
] as const;

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-12%" }}
      variants={reveal}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function CredentialsExperience({ listingCount }: { listingCount: number }) {
  // Two of the three headline figures are derived, not typed in — the advisor count from the
  // roster and the listing count from the live listings table — so they can't go stale on the
  // page while the underlying data moves.
  const advisorCount = AGENTS.length;
  const decorated = AGENTS.filter((a) => (a.accolades?.length ?? 0) > 0);
  const testimonials = HOMEUP_TESTIMONIALS.filter((t) => t.photo).slice(0, 6);

  return (
    <>
      {/* ─── 1 · Opening ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-neutral-900">
        <Image
          src="/images/buy-hero-condo-interior.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-neutral-950/40 to-neutral-950/90" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-7xl"
          >
            Real advice.
            <br />
            Real experience.
            <br />
            <span className="text-primary-300">A better way home.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-white/70"
          >
            HomeUP helps Singapore homeowners sell, buy and upgrade with confidence — experienced
            advisors, transparent fixed fees, and property technology that does the homework.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-12 flex flex-col items-center gap-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm text-white/90 backdrop-blur">
              <BadgeCheck className="h-4 w-4 text-primary-300" />
              1,000+ transactions closed
            </span>
            <a href="#credentials" className="text-sm text-white/50 transition hover:text-white">
              See why homeowners choose HomeUP ↓
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── 2 · Credentials ─────────────────────────────────────────────── */}
      <div id="credentials" className="bg-primary-950 py-28 text-white sm:py-36">
        <Section className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Trusted by homeowners.
            <br />
            <span className="text-primary-300">Built by property people.</span>
          </h2>
        </Section>

        <div className="mx-auto mt-20 max-w-5xl space-y-24 px-6">
          {[
            { n: "01", value: 1000, suffix: "+", label: "Transactions closed", body: "Across HDB, condominium, executive condominium and landed homes." },
            { n: "02", value: advisorCount, label: "CEA-licensed advisors", body: `Every one registered and publicly verifiable, operating under ${LEGAL_NAME}.` },
            { n: "03", value: listingCount, suffix: "+", label: "Active listings", body: "Live inventory across Singapore right now — this figure reads from our listings database." },
          ].map((s) => (
            <Section key={s.n} className="grid gap-6 border-t border-white/10 pt-10 md:grid-cols-[6rem_1fr]">
              <span className="font-mono text-sm text-primary-400">{s.n}</span>
              <div>
                <CredentialCounter
                  value={s.value}
                  suffix={s.suffix}
                  className="block font-display text-7xl font-semibold tabular-nums text-white sm:text-8xl"
                />
                <p className="mt-4 text-xl text-white">{s.label}</p>
                <p className="mt-2 max-w-lg text-white/50">{s.body}</p>
              </div>
            </Section>
          ))}

          <Section className="grid gap-6 border-t border-white/10 pt-10 md:grid-cols-[6rem_1fr]">
            <span className="font-mono text-sm text-primary-400">04</span>
            <div>
              <p className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                HDB · CONDO · EC · LANDED
              </p>
              <p className="mt-4 max-w-lg text-white/50">
                Experience across the whole market, not one corner of it — which matters most when
                you are selling one type and buying another.
              </p>
            </div>
          </Section>
        </div>
      </div>

      {/* ─── 2b · Who we are ─────────────────────────────────────────────── */}
      <div className="bg-white py-28 sm:py-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <Section>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-100">
              <Image
                src="/images/buy-hero-condo-interior.png"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Section>
          <Section>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-600">Who we are</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
              Real estate should finally be fair.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              HomeUP was created around a simple belief: homeowners deserve expert advice without
              paying traditional percentage commissions. By using technology, automation and
              efficient operating systems, HomeUP provides full professional guidance while keeping
              fees transparent and predictable. The goal isn&apos;t simply to sell homes — it is to
              help Singaporeans sell, buy and upgrade with confidence.
            </p>
          </Section>
        </div>
      </div>

      {/* ─── 2c · People + technology ────────────────────────────────────── */}
      <div className="bg-neutral-50 py-28 sm:py-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <Section className="lg:order-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-100">
              <Image
                src="/images/team-group.png"
                alt="The HomeUP team"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Section>
          <Section className="lg:order-1">
            <p className="text-xs uppercase tracking-[0.2em] text-primary-600">A modern advisory</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
              Built around people, strengthened by technology.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600">
              HomeUP combines experienced CEA-registered advisors with research, automation and
              digital tools to simplify complex property decisions. Technology handles the repetitive
              work so advisors can spend more time helping families make informed decisions — not
              less.
            </p>
          </Section>
        </div>
      </div>

      {/* ─── 2d · A growing network ──────────────────────────────────────── */}
      <div className="bg-primary-950 py-28 text-white sm:py-36">
        <Section className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-400">A growing network</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Growing one neighbourhood at a time.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-white/60">
            HomeUP is actively building toward 400 listings. More listings strengthen buyer reach,
            increase shared marketing exposure, and support the fixed-fee model.
          </p>

          <div className="mx-auto mt-12 max-w-md">
            <div className="flex items-end justify-between">
              <span className="font-display text-6xl font-semibold tabular-nums">
                <CredentialCounter value={listingCount} suffix="" />
              </span>
              <span className="pb-2 text-lg text-white/50">/ 400 listings</span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary-400"
                style={{ width: `${Math.min(100, Math.round((listingCount / 400) * 100))}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-white/40">
              Live count from our listings database, against the 400-listing goal.
            </p>
          </div>
        </Section>
      </div>

      {/* ─── 3 · What's at stake ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <Image src="/images/buy-hero-hdb-interior.png" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-neutral-950/65" />
        <Section className="relative mx-auto max-w-3xl px-6 text-center text-white">
          <p className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Your home isn&apos;t just a transaction.
          </p>
          <p className="mt-8 text-lg leading-relaxed text-white/70">
            It&apos;s where your money is. Where your memories are. And usually, where your next
            move begins.
          </p>
          <p className="mt-8 text-lg text-primary-300">That&apos;s why HomeUP was built differently.</p>
        </Section>
      </section>

      {/* ─── 4 · The fee model ───────────────────────────────────────────── */}
      <div className="bg-primary-950 py-28 text-white sm:py-36">
        <Section className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-400">The difference</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            A fixed fee, whatever your home sells for.
          </h2>
          <p className="mt-6 text-white/60">
            See how the fee model changes the economics of selling.
          </p>
        </Section>
        <div className="mt-16 px-6">
          <FeeComparison />
        </div>
      </div>

      {/* ─── 5 · The people ──────────────────────────────────────────────── */}
      <div className="bg-white py-28 sm:py-36">
        <Section className="mx-auto max-w-5xl px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-600">The people</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            Real, accountable professionals — with numbers you can check.
          </h2>
        </Section>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <Section key={agent.slug}>
              <Link href={`/agents/${agent.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-100">
                  <Image
                    src={agent.photo}
                    alt={agent.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-5 font-display text-xl font-semibold text-neutral-900">{agent.name}</p>
                <p className="mt-1 font-mono text-xs text-neutral-500">CEA {agent.cea}</p>
                {agent.accolades?.length ? (
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{agent.accolades[0]}</p>
                ) : null}
              </Link>
            </Section>
          ))}
        </div>

        <Section className="mx-auto mt-16 max-w-3xl px-6">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-primary-600" />
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              HomeUP operates as <strong className="text-neutral-900">{LEGAL_NAME}</strong>, CEA
              licence <strong className="text-neutral-900">{CEA_LICENSE}</strong>, part of{" "}
              {PARENT_ORG_NAME} (UEN {PARENT_ORG_UEN}).{" "}
              {advisorCount} registered advisors, each listed above with their own registration
              number.
            </p>
            <a
              href={CEA_REGISTER}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Verify our CEA registration
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Section>
      </div>

      {/* ─── 6 · Proof ───────────────────────────────────────────────────── */}
      <div className="bg-neutral-50 py-28 sm:py-36">
        <Section className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            Don&apos;t take our word for it.
          </h2>
          <p className="mt-5 text-neutral-600">
            Reviews published by clients on Google and Facebook.
          </p>
        </Section>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Section key={t.name}>
              <figure className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white">
                {t.photo ? (
                  <div className="relative h-44">
                    <Image
                      src={t.photo}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                      style={{ objectPosition: t.photoPosition ?? "center" }}
                    />
                  </div>
                ) : null}
                <blockquote className="flex flex-1 flex-col p-6">
                  <p className="flex-1 text-sm leading-relaxed text-neutral-700">
                    “{t.text.length > 220 ? `${t.text.slice(0, 220).trimEnd()}…` : t.text}”
                  </p>
                  <figcaption className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                    <span className="text-sm font-medium text-neutral-900">{t.name}</span>
                    {t.source ? (
                      <span className="text-xs text-neutral-400">via {t.source}</span>
                    ) : null}
                  </figcaption>
                </blockquote>
              </figure>
            </Section>
          ))}
        </div>
      </div>

      {/* ─── 7 · Journey ─────────────────────────────────────────────────── */}
      <div className="bg-white py-28 sm:py-36">
        <Section className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-600">How it works</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            More than a listing service.
          </h2>
        </Section>

        <div className="mx-auto mt-16 max-w-3xl px-6">
          {JOURNEY.map(([title, body], i) => (
            <Section key={title}>
              <div className="flex gap-6 border-t border-neutral-200 py-8">
                <span className="w-10 shrink-0 font-mono text-sm text-primary-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-2xl font-semibold text-neutral-900">{title}</p>
                  <p className="mt-2 leading-relaxed text-neutral-600">{body}</p>
                </div>
              </div>
            </Section>
          ))}
        </div>
      </div>

      {/* ─── 8 · Close ───────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[80vh] items-center overflow-hidden">
        <Image src="/images/buy-hero-showroom-model.png" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-neutral-950/75" />
        <Section className="relative mx-auto max-w-3xl px-6 text-center text-white">
          <p className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Your home is probably your biggest asset.
          </p>
          <p className="mt-6 text-xl text-white/70">
            You deserve advice that treats it that way.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-primary-700"
            >
              Start a conversation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sell"
              className="rounded-full border border-white/25 px-8 py-4 text-base font-medium text-white/90 transition hover:bg-white/10"
            >
              Explore how HomeUP works
            </Link>
          </div>
          {decorated.length > 0 ? (
            <p className="mt-10 text-xs text-white/40">
              {decorated.length} of our advisors hold published industry accolades — listed on their
              individual profiles.
            </p>
          ) : null}
        </Section>
      </section>
    </>
  );
}
