"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import type { SellPropertyType } from "@/lib/data/sell-pricing";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";

interface ProcessStep {
  step: string;
  title: string;
  body: string;
  weeks: string;
  highlight?: boolean;
}

const HDB_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "MOP and eligibility confirmed. CPF impact and net proceeds estimated. Sale price target set with data from recent transactions in your block and town.",
    weeks: "Week 1",
  },
  {
    step: "02",
    title: "List & Market",
    body: "Your flat goes live on PropertyGuru, SRX, 99.co, and HomeUP.sg — plus targeted social media. HomeUP screens all buyer enquiries before confirming any viewing.",
    weeks: "Week 2",
  },
  {
    step: "03",
    title: "You Host Viewings",
    body: "HomeUP briefs you on what buyers ask, screens interested parties, and coordinates the schedule. You host the tours — you know your home best. We handle all follow-up.",
    weeks: "Week 3–6",
    highlight: true,
  },
  {
    step: "04",
    title: "OTP & HDB Submission",
    body: "Offer accepted and negotiated. OTP signed, option fee received. HomeUP handles HDB Resale Portal submission, coordinates valuation, and tracks HDB approval.",
    weeks: "Week 5–12",
  },
  {
    step: "05",
    title: "Completion",
    body: "HDB Hub appointment confirmed. Keys handed over. CPF proceeds and net sale amount settled. Your HomeUP agent is with you at every step through to the final day.",
    weeks: "Week 14–20",
  },
];

const CONDO_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "SSD applicability confirmed. Outstanding mortgage and net proceeds reviewed. Asking price set against recent transacted prices for comparable units in your development.",
    weeks: "Week 1",
  },
  {
    step: "02",
    title: "List & Market",
    body: "Multi-platform listing across PropertyGuru, SRX, 99.co, and HomeUP.sg plus social channels. Buyer enquiries screened and responded to systematically — no opportunities lost.",
    weeks: "Week 2",
  },
  {
    step: "03",
    title: "You Host Viewings",
    body: "HomeUP briefs you, screens buyers for seriousness and eligibility, and manages the viewing schedule. You show your unit. We follow up with every buyer and track feedback closely.",
    weeks: "Week 3–8",
    highlight: true,
  },
  {
    step: "04",
    title: "OTP & S&P",
    body: "Offer negotiated. OTP signed at 1% option fee. HomeUP coordinates with both solicitors through the Sale & Purchase Agreement and ensures all deadlines are met.",
    weeks: "Week 6–12",
  },
  {
    step: "05",
    title: "Legal Completion",
    body: "Legal completion confirmed with your solicitor. Mortgage discharged. Net sale proceeds received. HomeUP tracks every milestone from S&P to the day funds clear.",
    weeks: "Week 20–24",
  },
];

const LANDED_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "Tenure and land title checked. Valuation guidance prepared against recent comparable landed transactions. Buyer profile defined — including citizenship eligibility checks that apply to landed homes.",
    weeks: "Week 1–2",
  },
  {
    step: "02",
    title: "Targeted Marketing",
    body: "Landed homes need a different marketing approach — targeted reach to serious buyers, not mass-listing volume. HomeUP runs targeted digital campaigns and reaches out to qualified buyer networks.",
    weeks: "Week 2–4",
  },
  {
    step: "03",
    title: "You Host Viewings",
    body: "HomeUP vets every buyer before a viewing is confirmed — financial qualification and eligibility checked. You host the tour of your home. We attend negotiations and handle all follow-through.",
    weeks: "Week 4–12",
    highlight: true,
  },
  {
    step: "04",
    title: "Negotiate & OTP",
    body: "Patient, structured negotiation focused on your net proceeds — not a rushed close. OTP signed with terms reviewed carefully. HomeUP presents all offers with a full assessment.",
    weeks: "Week 8–16",
  },
  {
    step: "05",
    title: "Legal Completion",
    body: "S&P Agreement prepared by solicitors. Buyer caveat lodged. Any foreign buyer LDAU approval tracked. Legal completion confirmed. Proceeds settled and keys handed over.",
    weeks: "Week 24–32",
  },
];

const STEPS_BY_TYPE: Record<SellPropertyType, ProcessStep[]> = {
  HDB: HDB_STEPS,
  Condo: CONDO_STEPS,
  Landed: LANDED_STEPS,
};

const TITLE_BY_TYPE: Record<SellPropertyType, string> = {
  HDB: "From first call to HDB Hub — every step, mapped out.",
  Condo: "From first call to legal completion — no guesswork.",
  Landed: "A structured process for a considered sale.",
};

const LEAD_BY_TYPE: Record<SellPropertyType, string> = {
  HDB: "The HDB resale process has fixed timelines and mandatory steps. HomeUP plans around all of them so you always know what happens next — and when.",
  Condo: "Resale condo sales move through legal milestones. HomeUP coordinates every deadline from OTP to completion so nothing falls through the cracks.",
  Landed: "Landed sales take longer and require more careful buyer qualification. HomeUP manages the full process so you can make decisions calmly, not under pressure.",
};

interface SellProcessFlowProps {
  propertyType: SellPropertyType;
}

export function SellProcessFlow({ propertyType }: SellProcessFlowProps) {
  const steps = STEPS_BY_TYPE[propertyType];

  return (
    <section aria-label="How selling with HomeUP works" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="section-title">{TITLE_BY_TYPE[propertyType]}</h2>
          <p className="section-lead">{LEAD_BY_TYPE[propertyType]}</p>
        </FadeInUp>

        {/* Desktop: horizontal arrow flow */}
        <div className="hidden lg:flex items-stretch gap-0 mt-10">
          {steps.map((s, i) => (
            <div key={s.step} className="flex items-stretch flex-1 min-w-0">
              <div
                className={[
                  "relative flex flex-col rounded-2xl p-5 w-full transition-shadow",
                  s.highlight
                    ? "bg-primary-600 text-neutral-0 shadow-brand-md ring-2 ring-primary-400"
                    : "bg-white border border-neutral-200 shadow-sm",
                ].join(" ")}
              >
                <div
                  className={[
                    "mb-1 text-xs font-medium uppercase tracking-widest",
                    s.highlight ? "text-primary-200" : "text-neutral-400",
                  ].join(" ")}
                >
                  {s.weeks}
                </div>
                <div
                  className={[
                    "font-display text-2xl font-extrabold",
                    s.highlight ? "text-primary-200" : "text-primary-100",
                  ].join(" ")}
                >
                  {s.step}
                </div>
                <h3
                  className={[
                    "mt-2 text-sm font-bold",
                    s.highlight ? "text-neutral-0" : "text-neutral-900",
                  ].join(" ")}
                >
                  {s.title}
                  {s.highlight && (
                    <span className="ml-2 inline-block rounded-full bg-primary-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-900">
                      You do this
                    </span>
                  )}
                </h3>
                <p
                  className={[
                    "mt-2 text-xs leading-relaxed",
                    s.highlight ? "text-primary-100" : "text-neutral-600",
                  ].join(" ")}
                >
                  {s.body}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-shrink-0 flex items-center justify-center px-2">
                  <ArrowRight
                    aria-hidden="true"
                    className="h-5 w-5 text-neutral-300"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical stack with connectors */}
        <div className="flex flex-col gap-0 mt-10 lg:hidden">
          {steps.map((s, i) => (
            <div key={s.step}>
              <div
                className={[
                  "rounded-2xl p-5",
                  s.highlight
                    ? "bg-primary-600 text-neutral-0 shadow-brand-md"
                    : "bg-white border border-neutral-200 shadow-sm",
                ].join(" ")}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={[
                      "text-xs font-medium uppercase tracking-widest",
                      s.highlight ? "text-primary-200" : "text-neutral-400",
                    ].join(" ")}
                  >
                    {s.weeks}
                  </span>
                  <span
                    className={[
                      "font-display text-xl font-extrabold",
                      s.highlight ? "text-primary-200" : "text-primary-100",
                    ].join(" ")}
                  >
                    {s.step}
                  </span>
                </div>
                <h3
                  className={[
                    "text-sm font-bold",
                    s.highlight ? "text-neutral-0" : "text-neutral-900",
                  ].join(" ")}
                >
                  {s.title}
                  {s.highlight && (
                    <span className="ml-2 inline-block rounded-full bg-primary-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-900">
                      You do this
                    </span>
                  )}
                </h3>
                <p
                  className={[
                    "mt-2 text-xs leading-relaxed",
                    s.highlight ? "text-primary-100" : "text-neutral-600",
                  ].join(" ")}
                >
                  {s.body}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ChevronDown aria-hidden="true" className="h-5 w-5 text-neutral-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        <FadeInUp delay={0.2} className="mt-8 rounded-xl bg-neutral-900 px-6 py-5 text-center">
          <p className="text-sm font-medium text-neutral-200">
            Every step is handled by the same dedicated HomeUP agent — not handed off to a junior coordinator.
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}
