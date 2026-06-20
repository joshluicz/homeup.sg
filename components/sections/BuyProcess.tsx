"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { BuyPropertyType } from "@/lib/data/buy-pricing";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";

interface ProcessStep {
  step: string;
  title: string;
  body: string;
  highlight?: boolean;
}

function stepLabel(step: string) {
  return `Step ${Number(step)}`;
}

const HDB_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "Grant eligibility confirmed. Central Provident Fund (CPF) usage, HDB vs bank loan options, and affordability reviewed. If you're selling and buying, timelines are mapped together from day one.",
  },
  {
    step: "02",
    title: "Valuation Advice",
    body: "HomeUP advisors give you personalised advice on your shortlisted home. We will run a valuation analysis for you and advise on what is a right price to pay, along with the terms.",
  },
  {
    step: "03",
    title: "View at Your Convenience",
    body: "You view the HDB unit anytime at your own convenience, and our HDB advisors will provide you with support one-call-away.",
    highlight: true,
  },
  {
    step: "04",
    title: "Offer & Negotiate",
    body: "Once unit has been shortlisted, HomeUP agents will advise and negotiate on your behalf. With a fixed fee, our agents will do our best to secure the lowest price.",
  },
  {
    step: "05",
    title: "OTP & Documentation",
    body: "Once your offer has been accepted, we will handle the Option to Purchase (OTP) documentation on your behalf. We will also submit the valuation request to HDB, manage the HDB Resale Application, and guide you through every step of the process right up to completion.",
  },
];

const CONDO_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "Additional Buyer's Stamp Duty (ABSD) reviewed based on your profile. Affordability and loan headroom calculated. If you're selling simultaneously, both timelines are coordinated to reduce financial risk.",
  },
  {
    step: "02",
    title: "Market Analysis",
    body: "Shortlist of developments built around your budget, location, tenure, and investment intent. Resale potential, price psf trends, and nearby supply pipeline reviewed independently.",
  },
  {
    step: "03",
    title: "Viewing with you",
    body: "Viewings arranged across shortlisted units. HomeUP attends with you and checks layout efficiency, noise, orientation, and any red flags before you form an attachment.",
  },
  {
    step: "04",
    title: "Negotiate & OTP",
    body: "Offer structured based on comparable transacted prices, unit condition, and seller urgency. HomeUP negotiates with your interests as the only priority, not speed of close.",
  },
  {
    step: "05",
    title: "Completion",
    body: "Loan approved, insurance arranged, and completion timeline tracked. HomeUP monitors every milestone to key collection.",
  },
];

const NEW_LAUNCH_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Consult & Plan",
    body: "Additional Buyer's Stamp Duty (ABSD) and total debt servicing reviewed. Budget aligned to what the progressive payment schedule can sustainably support. Project shortlist built from your goals, not a developer's incentive.",
  },
  {
    step: "02",
    title: "Project Analysis",
    body: "HomeUP compares shortlisted projects across location, developer track record, pricing psf vs nearby comparables, floor plan efficiency, stack orientation, and projected resale potential.",
  },
  {
    step: "03",
    title: "Preview and Launch",
    body: "HomeUP secures preview access, advises on which stacks to prioritise, and attends launch day with you. We help you make a clear-headed decision under time pressure, not an emotional one.",
  },
  {
    step: "04",
    title: "Unit Selection & Option",
    body: "Unit selected based on your priorities, not the developer's preferred stack. Option fee (typically 5%) paid. Option to Purchase (OTP) terms reviewed before you commit.",
  },
  {
    step: "05",
    title: "Completion",
    body: "HomeUP walks you through the progressive payment schedule tied to construction milestones. HomeUP monitors every milestone to key collection.",
  },
];

const GENERAL_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Understand your position",
    body: "Grants, Central Provident Fund (CPF), loan eligibility, Additional Buyer's Stamp Duty (ABSD), and sell-buy timing reviewed. You'll know your real budget and the safest path forward before you view a single home.",
  },
  {
    step: "02",
    title: "Shortlist & Compare",
    body: "HomeUP shortlists properties against your budget, goals, and constraints, and compares them honestly. No pressure toward higher-priced options.",
  },
  {
    step: "03",
    title: "Viewings, coordinated",
    body: "All viewings scheduled and attended. Unit condition, location trade-offs, and resale potential reviewed at each one, so you make decisions with context.",
  },
  {
    step: "04",
    title: "Negotiate & Offer",
    body: "Offer price benchmarked to recent transactions. HomeUP negotiates on your behalf, with your net position (not the speed of close) as the priority.",
  },
  {
    step: "05",
    title: "Documentation & Completion",
    body: "Option to Purchase (OTP), Sale and Purchase (S&P), grant applications, and legal coordination handled through to completion. If you're selling and buying, both transactions are tracked as one.",
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
  CondoLanded: "What we do better",
  NewLaunch: "Buying a new launch",
  General: "How HomeUP guides your purchase, start to finish.",
};

const LEAD_BY_TYPE: Record<BuyPropertyType | "General", string> = {
  HDB: "HDB resale has more steps than most buyers expect: grants, loan eligibility, HDB Portal submission, and tight timelines. HomeUP plans it all upfront so there are no surprises.",
  CondoLanded: "Resale private property requires objective analysis and disciplined negotiation. HomeUP's fee isn't tied to your purchase price, so our advice stays neutral throughout.",
  NewLaunch: "New launch decisions are made under time pressure. HomeUP's independent analysis and launch day support means you choose with clarity, not pressure.",
  General: "Whether you're buying HDB, resale private property, or a new launch, HomeUP coordinates the full purchase journey so you can focus on finding the right home.",
};

interface BuyProcessProps {
  propertyType?: BuyPropertyType | null;
}

function useIsDesktopProcessLayout() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function ProcessStepCard({ step }: { step: ProcessStep }) {
  return (
    <div
      className={[
        "relative flex w-full flex-col rounded-2xl p-5 transition-shadow",
        step.highlight
          ? "bg-primary-600 text-neutral-0 shadow-brand-md ring-2 ring-primary-400"
          : "border border-neutral-200 bg-white shadow-sm",
      ].join(" ")}
    >
      <div
        className={[
          "mb-1 font-display text-xl font-extrabold lg:text-2xl",
          step.highlight ? "text-primary-200" : "text-primary-600",
        ].join(" ")}
      >
        {stepLabel(step.step)}
      </div>
      <h3
        className={[
          "mt-2 text-sm font-bold",
          step.highlight ? "text-neutral-0" : "text-neutral-900",
        ].join(" ")}
      >
        {step.title}
        {step.highlight && (
          <span className="ml-2 inline-block rounded-full bg-primary-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-900">
            You do this
          </span>
        )}
      </h3>
      <p
        className={[
          "mt-2 text-xs leading-relaxed",
          step.highlight ? "text-primary-100" : "text-neutral-600",
        ].join(" ")}
      >
        {step.body}
      </p>
    </div>
  );
}

export function BuyProcess({ propertyType = null }: BuyProcessProps) {
  const key = propertyType ?? "General";
  const steps = STEPS_BY_TYPE[key];
  const isDesktop = useIsDesktopProcessLayout();

  return (
    <section aria-label="How buying with HomeUP works" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="section-title">{TITLE_BY_TYPE[key]}</h2>
          <p className="section-lead">{LEAD_BY_TYPE[key]}</p>
        </FadeInUp>

        {isDesktop !== false ? (
          <div className="mt-10 flex items-stretch gap-0">
            {steps.map((s, i) => (
              <div key={s.step} className="flex min-w-0 flex-1 items-stretch">
                <ProcessStepCard step={s} />
                {i < steps.length - 1 && (
                  <div className="flex shrink-0 items-center justify-center px-2">
                    <ArrowRight aria-hidden="true" className="h-5 w-5 text-neutral-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-0">
            {steps.map((s, i) => (
              <div key={s.step}>
                <ProcessStepCard step={s} />
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ChevronDown aria-hidden="true" className="h-5 w-5 text-neutral-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
