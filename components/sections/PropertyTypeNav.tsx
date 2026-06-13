"use client";

import Link from "next/link";
import { ArrowRight, Building, Home, TreePine, DollarSign, Landmark, Sparkles } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

interface PropertyTypeCard {
  icon: React.ElementType;
  label: string;
  tag: string;
  fee: string;
  feeNote: string;
  bullets: string[];
  href: string;
  accentClass: string;
  iconBgClass: string;
  tagClass: string;
}

const SELL_CARDS: PropertyTypeCard[] = [
  {
    icon: Building,
    label: "HDB Flat",
    tag: "Most popular",
    fee: "$1,999",
    feeNote: "+ GST fixed fee",
    bullets: [
      "MOP and eligibility checked upfront",
      "HDB Resale Portal submission handled",
      "CPF impact and net proceeds estimated",
    ],
    href: "/sell-hdb",
    accentClass: "border-blue-200 hover:border-blue-400",
    iconBgClass: "bg-blue-50 text-blue-600",
    tagClass: "bg-blue-100 text-blue-800",
  },
  {
    icon: Home,
    label: "Condo or EC",
    tag: "Broadest buyer pool",
    fee: "$4,999",
    feeNote: "+ GST fixed fee",
    bullets: [
      "SSD checked before listing timeline set",
      "Multi-platform listing + social marketing",
      "Lawyer coordination through to completion",
    ],
    href: "/sell-condo",
    accentClass: "border-primary-200 hover:border-primary-500",
    iconBgClass: "bg-primary-50 text-primary-600",
    tagClass: "bg-primary-100 text-primary-800",
  },
  {
    icon: TreePine,
    label: "Landed Home",
    tag: "High-value sale",
    fee: "$9,999",
    feeNote: "+ GST fixed fee",
    bullets: [
      "Tenure and zoning confirmed before listing",
      "Buyer eligibility vetted before every viewing",
      "Patient negotiation on net proceeds",
    ],
    href: "/sell-landed",
    accentClass: "border-amber-200 hover:border-amber-400",
    iconBgClass: "bg-amber-50 text-amber-600",
    tagClass: "bg-amber-100 text-amber-900",
  },
];

const BUY_CARDS: PropertyTypeCard[] = [
  {
    icon: Building,
    label: "HDB Resale",
    tag: "Fixed fee",
    fee: "$1,999",
    feeNote: "+ GST buyer fee",
    bullets: [
      "Grant eligibility and CPF planning first",
      "HDB loan vs bank loan guidance",
      "Full OTP and resale portal support",
    ],
    href: "/buy-hdb",
    accentClass: "border-blue-200 hover:border-blue-400",
    iconBgClass: "bg-blue-50 text-blue-600",
    tagClass: "bg-blue-100 text-blue-800",
  },
  {
    icon: Home,
    label: "Condo or Landed",
    tag: "Complimentary",
    fee: "Free",
    feeNote: "No buyer commission",
    bullets: [
      "ABSD and affordability reviewed upfront",
      "Unbiased project and unit comparisons",
      "Sell-and-buy timing coordinated",
    ],
    href: "/buy-condo-landed",
    accentClass: "border-primary-200 hover:border-primary-500",
    iconBgClass: "bg-primary-50 text-primary-600",
    tagClass: "bg-primary-100 text-primary-800",
  },
  {
    icon: Sparkles,
    label: "New Launch",
    tag: "Complimentary",
    fee: "Free",
    feeNote: "Developer pays agent",
    bullets: [
      "Independent project and floor plan analysis",
      "Priority access to launch previews",
      "No showroom pressure — unbiased advice",
    ],
    href: "/buy-new-launch",
    accentClass: "border-amber-200 hover:border-amber-400",
    iconBgClass: "bg-amber-50 text-amber-600",
    tagClass: "bg-amber-100 text-amber-900",
  },
];

const CONFIG = {
  sell: {
    eyebrow: "Choose Your Property Type",
    title: "What type of home are you selling?",
    lead: "HomeUP offers the same full-service experience across all property types — at a transparent fixed fee, with the process tailored to what each sale actually requires.",
    cards: SELL_CARDS,
  },
  buy: {
    eyebrow: "Choose Your Property Type",
    title: "What type of home are you buying?",
    lead: "HomeUP provides buyer representation across all Singapore property types — from HDB resale at a fixed fee to condo, landed, and new launch at no cost to you.",
    cards: BUY_CARDS,
  },
};

interface PropertyTypeNavProps {
  mode: "sell" | "buy";
}

export function PropertyTypeNav({ mode }: PropertyTypeNavProps) {
  const { eyebrow, title, lead, cards } = CONFIG[mode];

  return (
    <section aria-label="Choose your property type" className="section-padding bg-neutral-100">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="section-title">{title}</h2>
          <p className="section-lead">{lead}</p>
        </FadeInUp>

        <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <StaggerItem key={card.label}>
                <Link
                  href={card.href}
                  className={[
                    "group flex h-full flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-200 cursor-pointer",
                    card.accentClass,
                    "hover:shadow-md hover:-translate-y-0.5",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBgClass}`}>
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${card.tagClass}`}>
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900">{card.label}</h3>

                  <div className="mt-1 mb-4">
                    <span className="font-display text-2xl font-extrabold text-neutral-900">
                      {card.fee}
                    </span>
                    <span className="ml-1.5 text-xs text-neutral-500">{card.feeNote}</span>
                  </div>

                  <ul className="flex-1 space-y-2.5">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-neutral-600">
                        <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:text-primary-700 transition-colors">
                    Learn more
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
