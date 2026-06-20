"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { SellPropertyType } from "@/lib/data/sell-pricing";
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
    title: "First Consultation",
    body: "MOP and eligibility confirmed. CPF impact and net proceeds estimated. Sale price target set with data from recent transactions in your block and town.",
  },
  {
    step: "02",
    title: "List & Market",
    body: "Your flat is listed on four property portals — PropertyGuru, SRX, 99.co, and HomeUP.sg — and promoted on four social channels: Instagram, TikTok, Facebook, and YouTube. HomeUP screens all buyer enquiries before confirming any viewing.",
  },
  {
    step: "03",
    title: "Open-the-Door",
    body: "HomeUP will brief buyers on your unit's details (floor plan, videos, etc.), screen interested parties, and coordinate the schedule. We just need someone to open the doors for the buyers.",
    highlight: true,
  },
  {
    step: "04",
    title: "OTP & HDB Submission",
    body: "Offer accepted and negotiated. We will issue OTP when option fee is received. HomeUP handles HDB Resale Portal submission, coordinates valuation, and tracks HDB approval.",
  },
  {
    step: "05",
    title: "Completion",
    body: "HDB Hub appointment confirmed. Keys handed over. CPF proceeds and net sale amount settled.",
  },
];

const CONDO_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "First Consultation",
    body: "SSD applicability confirmed. Outstanding mortgage and net proceeds reviewed. Asking price set against recent transacted prices for comparable units in your development.",
  },
  {
    step: "02",
    title: "List & Market",
    body: "Your unit is listed on four property portals — PropertyGuru, SRX, 99.co, and HomeUP.sg — and promoted on four social channels: Instagram, TikTok, Facebook, and YouTube. Buyer enquiries are screened and responded to systematically. No opportunities lost.",
  },
  {
    step: "03",
    title: "Open-the-Door",
    body: "HomeUP briefs you, screens buyers for seriousness and eligibility, and manages the viewing schedule. You show your unit. We follow up with every buyer and track feedback closely.",
    highlight: true,
  },
  {
    step: "04",
    title: "OTP & S&P",
    body: "Offer negotiated. OTP signed at 1% option fee. HomeUP coordinates with both solicitors through the Sale & Purchase Agreement and ensures all deadlines are met.",
  },
  {
    step: "05",
    title: "Legal Completion",
    body: "Legal completion confirmed with your solicitor. Mortgage discharged. Net sale proceeds received. HomeUP tracks every milestone from S&P to the day funds clear.",
  },
];

const LANDED_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "First Consultation",
    body: "Tenure and land title checked. Valuation guidance prepared against recent comparable landed transactions. Buyer profile defined, including citizenship eligibility checks that apply to landed homes.",
  },
  {
    step: "02",
    title: "Targeted Marketing",
    body: "Your home is listed on four property portals — PropertyGuru, SRX, 99.co, and HomeUP.sg — and promoted on four social channels: Instagram, TikTok, Facebook, and YouTube. Targeted reach to serious buyers, not mass-listing volume alone.",
  },
  {
    step: "03",
    title: "Open-the-Door",
    body: "HomeUP vets every buyer before a viewing is confirmed. Financial qualification and eligibility checked. You host the tour of your home. We attend negotiations and handle all follow-through.",
    highlight: true,
  },
  {
    step: "04",
    title: "Negotiate & OTP",
    body: "Patient, structured negotiation focused on your net proceeds, not a rushed close. OTP signed with terms reviewed carefully. HomeUP presents all offers with a full assessment.",
  },
  {
    step: "05",
    title: "Legal Completion",
    body: "S&P Agreement prepared by solicitors. Buyer caveat lodged. Any foreign buyer LDAU approval tracked. Legal completion confirmed. Proceeds settled and keys handed over.",
  },
];

const STEPS_BY_TYPE: Record<SellPropertyType, ProcessStep[]> = {
  HDB: HDB_STEPS,
  Condo: CONDO_STEPS,
  Landed: LANDED_STEPS,
};

const TITLE_BY_TYPE: Record<SellPropertyType, string> = {
  HDB: "Every step mapped out, from first call to completion.",
  Condo: "From first call to legal completion. No guesswork.",
  Landed: "A structured process for a considered sale.",
};

const LEAD_BY_TYPE: Record<SellPropertyType, string> = {
  HDB: "The HDB resale process has fixed timelines and mandatory steps. HomeUP plans around all of them so you always know what happens next and when.",
  Condo: "Resale condo sales move through legal milestones. HomeUP coordinates every deadline from OTP to completion so nothing falls through the cracks.",
  Landed: "Landed sales take longer and require more careful buyer qualification. HomeUP manages the full process so you can make decisions calmly, not under pressure.",
};

interface SellProcessFlowProps {
  propertyType: SellPropertyType;
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
          : "bg-white border border-neutral-200 shadow-sm",
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

export function SellProcessFlow({ propertyType }: SellProcessFlowProps) {
  const steps = STEPS_BY_TYPE[propertyType];
  const isDesktop = useIsDesktopProcessLayout();

  return (
    <section aria-label="How selling with HomeUP works" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="section-title">{TITLE_BY_TYPE[propertyType]}</h2>
          <p className="section-lead">{LEAD_BY_TYPE[propertyType]}</p>
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
