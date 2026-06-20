"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AGENTS, getAgentBySlug } from "@/lib/data/agents";
import { SITE_VISION } from "@/lib/seo/constants";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LastUpdated } from "@/components/ui/LastUpdated";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const FOUNDERS = [
  {
    slug: "dennis-lim",
    displayName: "Dennis Lim",
    paragraphs: [
      "I strongly believe in the fixed fee model because it allows homeowners to achieve better outcomes without overpaying in commissions, while still getting strong exposure and viewings for their property.",
      "We started HomeUP with a long term vision to build a modern, tech driven property advisory. By using AI tools, automation, and video systems, we aim to keep our operating costs efficient so we can continue offering a fixed fee of $1,999 for Singapore homeowners for as long as possible.",
    ],
  },
  {
    slug: "yeo-tong-boon",
    displayName: "Yeo Tong Boon",
    paragraphs: [
      "I also believe strongly in the fixed fee model because I have seen first hand how much it helps the average Singaporean save meaningful costs when selling or buying a home.",
      "There is still a misconception that fixed fee agents are lower quality or purely transactional. I want to change that perception by showing that structured, transparent service can still come with strong advisory and care.",
      "Our goal is to be a trusted fixed fee partner for families, not just for selling, but also for buying the right next property. A poor purchase decision can cost just as much as high commissions, so we place strong emphasis on guiding clients to make sound, long term decisions.",
    ],
  },
] as const;

const FOUNDER_STYLES = [
  {
    card: "relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-accent-50/70 shadow-[0_8px_32px_rgba(0,154,68,0.12)]",
    bar: "bg-primary-600",
    glow: "bg-primary-400/30",
    glowPosition: "-right-12 -top-12",
    imageRing: "ring-primary-200/80",
  },
  {
    card: "relative overflow-hidden rounded-2xl border border-accent-200/80 bg-gradient-to-br from-accent-50 via-white to-primary-50/80 shadow-[0_8px_32px_rgba(224,160,8,0.12)]",
    bar: "bg-gradient-to-r from-accent-400 to-primary-500",
    glow: "bg-accent-300/35",
    glowPosition: "-left-12 -bottom-12",
    imageRing: "ring-accent-200/80",
  },
] as const;

export function AboutContent() {
  const [visionLead, visionEmphasis] = SITE_VISION.split(", because ");

  return (
    <>
      <section
        aria-label="About HomeUP"
        className="section-padding bg-gradient-to-b from-primary-50/50 via-white to-white"
      >
        <div className="container-page">
          <FadeInUp className="mx-auto max-w-3xl text-center">
            <Eyebrow>About HomeUP</Eyebrow>
            <h1 className="section-title">
              {visionLead}, because{" "}
              <span className="text-primary-600">{visionEmphasis}</span>
            </h1>
          </FadeInUp>

          <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-stretch">
            {FOUNDERS.map((founder, index) => {
              const agent = getAgentBySlug(founder.slug);
              if (!agent) return null;

              const style = FOUNDER_STYLES[index % FOUNDER_STYLES.length];

              return (
                <FadeInUp key={founder.slug} delay={0.1 + index * 0.08} className="h-full">
                  <div className={`${style.card} h-full`}>
                    <div
                      aria-hidden="true"
                      className={`absolute inset-x-0 top-0 h-1 ${style.bar}`}
                    />
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute h-36 w-36 rounded-full blur-3xl ${style.glow} ${style.glowPosition}`}
                    />
                    <div className="relative flex h-full flex-col gap-6 p-6 sm:p-8">
                      <div
                        className={`relative mx-auto aspect-[4/5] w-full max-w-[200px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-md ring-2 ${style.imageRing}`}
                      >
                        <Image
                          src={agent.photo}
                          alt={`${agent.name}, HomeUP co-founder`}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 1024px) 200px, 280px"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
                          <span className="font-bold text-neutral-900">{founder.displayName}</span>
                          <span aria-hidden="true" className="font-normal text-neutral-400">
                            ·
                          </span>
                          <span className="font-semibold text-primary-700">Co-founder</span>
                        </p>
                        <div className="mt-4 space-y-4">
                          {founder.paragraphs.map((paragraph) => (
                            <p
                              key={paragraph}
                              className="text-sm font-normal leading-relaxed text-neutral-700"
                            >
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeInUp>
              );
            })}
          </div>

          <FadeInUp delay={0.25} className="mt-12 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
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
                <dd className="mt-1 font-normal">
                  <a
                    href="https://www.cea.gov.sg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 underline-offset-2 hover:underline"
                  >
                    L3007139C
                  </a>{" "}
                  (Council for Estate Agencies)
                </dd>
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
