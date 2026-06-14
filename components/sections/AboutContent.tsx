"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Building2, Users } from "lucide-react";
import { AGENTS } from "@/lib/data/agents";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LastUpdated } from "@/components/ui/LastUpdated";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const STATS = [
  { value: "1,000+", label: "Transactions closed" },
  { value: "$200M+", label: "Real estate transacted" },
  { value: "6", label: "CEA-licensed advisors" },
  { value: "120+", label: "Active listings" },
];

const VALUES = [
  {
    icon: Building2,
    title: "Transparent fixed fees",
    body: "HDB from $1,999, Condo/EC from $4,999, Landed from $9,999. You get the same full service as a traditional agent, without percentage commission.",
  },
  {
    icon: Users,
    title: "Named advisors, not a call centre",
    body: "Every client works with a CEA-licensed advisor who knows your transaction. Registration numbers you can verify, plus real deal experience.",
  },
  {
    icon: Award,
    title: "Advice aligned with your interests",
    body: "Our fee is fixed, not tied to your sale price. Pricing guidance, negotiation, and planning stay focused on your outcome, not commission targets.",
  },
];

export function AboutContent() {
  return (
    <>
      <section aria-label="About HomeUP" className="section-padding bg-white">
        <div className="container-page">
          <FadeInUp className="mx-auto max-w-3xl text-center">
            <Eyebrow>About HomeUP</Eyebrow>
            <h1 className="section-title">
              More value. Less guesswork.{" "}
              <span className="text-primary-600">Better decisions.</span>
            </h1>
            <p className="section-lead mx-auto">
              HomeUP is a Singapore property advisory built around transparent fixed fees,
              named CEA-licensed advisors, and coordinated sell-and-buy planning. Property
              services are operated by C and H Properties Pte Ltd (CEA Licence L3007139C).
              The HomeUP brand is registered under Haus Plus Pte. Ltd. (UEN 202538756D).
            </p>
          </FadeInUp>

          <FadeInUp delay={0.1} className="mt-12 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
            <Image
              src="/images/team-group.png"
              alt="The HomeUP team, six CEA-licensed property agents in Singapore"
              width={920}
              height={614}
              className="h-auto w-full object-cover"
              priority
            />
          </FadeInUp>
        </div>
      </section>

      <section aria-label="HomeUP at a glance" className="section-padding bg-neutral-50">
        <div className="container-page">
          <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
                  <p className="font-display text-3xl font-extrabold text-primary-600">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm font-normal text-neutral-600">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section aria-label="What we stand for" className="section-padding bg-white">
        <div className="container-page">
          <FadeInUp className="section-header">
            <Eyebrow>Our Approach</Eyebrow>
            <h2 className="section-title">A different model for Singapore property</h2>
            <p className="section-lead">
              Most homeowners give away $10,000–$70,000 in agent commission on a single
              transaction. HomeUP was built to offer the same end-to-end service at a fee
              you know before you sign.
            </p>
          </FadeInUp>

          <StaggerContainer className="mt-10 grid gap-6 lg:grid-cols-3">
            {VALUES.map((item) => (
              <StaggerItem key={item.title}>
                <div className="h-full rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
                  <item.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-bold text-neutral-900">{item.title}</h3>
                  <p className="mt-2 text-sm font-normal leading-relaxed text-neutral-600">
                    {item.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section aria-label="Meet the team" className="section-padding bg-neutral-50">
        <div className="container-page">
          <FadeInUp className="section-header">
            <Eyebrow>Our Team</Eyebrow>
            <h2 className="section-title">CEA-licensed advisors you can verify</h2>
            <p className="section-lead">
              Every HomeUP advisor is CEA-registered with a public registration number,
              industry credentials, and hands-on transaction experience across HDB, condo,
              and landed property.
            </p>
          </FadeInUp>

          <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((agent) => (
              <StaggerItem key={agent.slug}>
                <Link
                  href={`/agents/${agent.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-primary-600/40 hover:shadow-md"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                    <Image
                      src={agent.photo}
                      alt={`${agent.name}, CEA ${agent.cea}, HomeUP property advisor`}
                      fill
                      className="object-cover object-top"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900">{agent.name}</p>
                    <p className="text-sm font-normal text-neutral-400">{agent.cea}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeInUp delay={0.15} className="mt-8 text-center">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
            >
              View full agent profiles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeInUp>
        </div>
      </section>

      <section aria-label="Company details" className="section-padding bg-white">
        <div className="container-page">
          <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
            <h2 className="text-sm font-bold text-neutral-900">Company information</h2>
            <dl className="mt-4 grid gap-4 text-sm text-neutral-600 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-neutral-900">Operating agency</dt>
                <dd className="mt-1 font-normal">C &amp; H Properties Pte Ltd</dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">Parent company</dt>
                <dd className="mt-1 font-normal">Haus Plus Pte. Ltd. (UEN 202538756D)</dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">CEA licence</dt>
                <dd className="mt-1 font-normal">L3007139C</dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">Office</dt>
                <dd className="mt-1 font-normal">125A Lor 2 Toa Payoh #02-138, Singapore 311125</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-neutral-900">Contact</dt>
                <dd className="mt-1 font-normal">+65 8087 7015 · Mon to Sun, 9am to 9pm</dd>
              </div>
            </dl>
            <LastUpdated className="mt-6" />
          </div>
        </div>
      </section>
    </>
  );
}
