"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import type { BuyPropertyType } from "@/lib/data/buy-pricing";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";

interface ProcessStep {
  step: string;
  title: string;
  body: string;
  weeks: string;
}

const HDB_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "Grant eligibility confirmed. CPF usage, HDB vs bank loan options, and affordability reviewed. If you're selling and buying, timelines are mapped together from day one.",
    weeks: "Week 1",
  },
  {
    step: "02",
    title: "Shortlist Homes",
    body: "HomeUP shortlists units aligned to your budget, location preferences, floor level priorities, and lease remaining. We filter out options that don't make financial sense for your situation.",
    weeks: "Week 2–4",
  },
  {
    step: "03",
    title: "Offer & Negotiate",
    body: "Offer price assessed against recent transacted prices for the block. HomeUP structures the offer and negotiates on your behalf. The goal is to close right, not just close fast.",
    weeks: "Week 4–8",
  },
  {
    step: "04",
    title: "OTP & Documentation",
    body: "OTP signed and grant applications submitted. HDB Resale Portal application filed. Checklist tracked through to the HDB completion appointment.",
    weeks: "Week 6–16",
  },
];

const CONDO_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "ABSD reviewed based on your profile. Affordability and loan headroom calculated. If you're selling simultaneously, both timelines are coordinated to reduce financial risk.",
    weeks: "Week 1",
  },
  {
    step: "02",
    title: "Market Analysis",
    body: "Shortlist of developments built around your budget, location, tenure, and investment intent. Resale potential, price psf trends, and nearby supply pipeline reviewed independently.",
    weeks: "Week 1–3",
  },
  {
    step: "03",
    title: "Negotiate & OTP",
    body: "Offer structured based on comparable transacted prices, unit condition, and seller urgency. HomeUP negotiates with your interests as the only priority, not speed of close.",
    weeks: "Week 4–9",
  },
  {
    step: "04",
    title: "S&P & Completion",
    body: "Sale & Purchase Agreement coordinated with your solicitor. Loan approved, insurance arranged, and completion timeline tracked. HomeUP monitors every milestone through to keys.",
    weeks: "Week 7–24",
  },
];

const NEW_LAUNCH_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "ABSD and total debt servicing reviewed. Budget aligned to what the progressive payment schedule can sustainably support. Project shortlist built from your goals, not a developer's incentive.",
    weeks: "Week 1",
  },
  {
    step: "02",
    title: "Project Analysis",
    body: "HomeUP compares shortlisted projects across location, developer track record, pricing psf vs nearby comparables, floor plan efficiency, stack orientation, and projected resale potential.",
    weeks: "Week 1–4",
  },
  {
    step: "03",
    title: "Unit Selection & Option",
    body: "Unit selected based on your priorities, not the developer's preferred stack. Option fee (typically 5%) paid. OTP terms reviewed before you commit.",
    weeks: "Week 5–8",
  },
  {
    step: "04",
    title: "S&P & Progressive Payments",
    body: "Sale & Purchase Agreement signed. HomeUP walks you through the progressive payment schedule tied to construction milestones. Snagging and handover coordinated at TOP.",
    weeks: "Week 7 onwards",
  },
];

const GENERAL_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Understand your position",
    body: "Grants, CPF, loan eligibility, ABSD, and sell-buy timing reviewed. You'll know your real budget and the safest path forward before you view a single home.",
    weeks: "Week 1",
  },
  {
    step: "02",
    title: "Shortlist & Compare",
    body: "HomeUP shortlists properties against your budget, goals, and constraints, and compares them honestly. No pressure toward higher-priced options.",
    weeks: "Week 2–4",
  },
  {
    step: "03",
    title: "Negotiate & Offer",
    body: "Offer price benchmarked to recent transactions. HomeUP negotiates on your behalf, with your net position (not the speed of close) as the priority.",
    weeks: "Week 4–8",
  },
  {
    step: "04",
    title: "Documentation & Completion",
    body: "OTP, S&P, grant applications, and legal coordination handled through to completion. If you're selling and buying, both transactions are tracked as one.",
    weeks: "Week 6 onwards",
  },
];

const STEPS_BY_TYPE: Record<BuyPropertyType | "General", ProcessStep[]> = {
  HDB: HDB_STEPS,
  CondoLanded: CONDO_STEPS,
  NewLaunch: NEW_LAUNCH_STEPS,
  General: GENERAL_STEPS,
};

const TITLE_BY_TYPE: Record<BuyPropertyType | "General", string> = {
  HDB: "Buying an HDB flat: here's how HomeUP handles it.",
  CondoLanded: "Buying resale condo or landed: what we do for you.",
  NewLaunch: "Buying a new launch: from analysis to keys.",
  General: "How HomeUP guides your purchase, start to finish.",
};

const LEAD_BY_TYPE: Record<BuyPropertyType | "General", string> = {
  HDB: "HDB resale has more steps than most buyers expect: grants, loan eligibility, HDB Portal submission, and tight timelines. HomeUP plans it all upfront so there are no surprises.",
  CondoLanded: "Resale private property requires objective analysis and disciplined negotiation. HomeUP's fee isn't tied to your purchase price, so our advice stays neutral throughout.",
  NewLaunch: "New launch decisions are made under time pressure with incomplete information. HomeUP's independent analysis and launch day support means you choose with clarity, not pressure.",
  General: "Whether you're buying HDB, resale private property, or a new launch, HomeUP coordinates the full purchase journey so you can focus on finding the right home.",
};

interface BuyProcessProps {
  propertyType?: BuyPropertyType | null;
}

export function BuyProcess({ propertyType = null }: BuyProcessProps) {
  const key = propertyType ?? "General";
  const steps = STEPS_BY_TYPE[key];

  return (
    <section aria-label="How buying with HomeUP works" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="section-title">{TITLE_BY_TYPE[key]}</h2>
          <p className="section-lead">{LEAD_BY_TYPE[key]}</p>
        </FadeInUp>

        {/* Desktop: horizontal arrow flow */}
        <div className="hidden lg:flex items-stretch gap-0 mt-10">
          {steps.map((s, i) => (
            <div key={s.step} className="flex items-stretch flex-1 min-w-0">
              <div className="relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 w-full shadow-sm">
                <div className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">
                  {s.weeks}
                </div>
                <div className="font-display text-2xl font-extrabold text-primary-600">
                  {s.step}
                </div>
                <h3 className="mt-2 text-sm font-bold text-neutral-900">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">{s.body}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-shrink-0 flex items-center justify-center px-2">
                  <ArrowRight aria-hidden="true" className="h-5 w-5 text-neutral-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical stack */}
        <div className="flex flex-col gap-0 mt-10 lg:hidden">
          {steps.map((s, i) => (
            <div key={s.step}>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                    {s.weeks}
                  </span>
                  <span className="font-display text-xl font-extrabold text-primary-600">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">{s.body}</p>
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
            No commitment required to start. Your first consultation is free, and there&#39;s no obligation to proceed.
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}
