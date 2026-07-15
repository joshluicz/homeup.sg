"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AboutListingsGoal } from "@/components/sections/AboutListingsGoal";
import { AGENTS, getAgentBySlug } from "@/lib/data/agents";
import { CEA_LICENSE, CEA_PUBLIC_REGISTER_URL, SITE_VISION } from "@/lib/seo/constants";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LastUpdated } from "@/components/ui/LastUpdated";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const FOUNDERS = [
  {
    slug: "dennis-lim",
    displayName: "Dennis Lim",
    paragraphs: [
      "I believe the fixed fee model will allow homeowners to achieve higher selling prices without overpaying in commission.",
      "We started HomeUP.sg with a long term vision to build a modern, tech driven property advisory. By using AI tools, automation, and video systems, we will keep our operating costs efficient so that we can continue to offer low fixed fees (starting from $1,999) for Singapore homeowners.",
    ],
  },
  {
    slug: "yeo-tong-boon",
    displayName: "Yeo Tong Boon",
    paragraphs: [
      "There is a misconception that fixed fee agents are lower quality or purely transactional that just help you to sell. I want to change that perception.",
      "Our goal is to help Singaporeans to sell and upgrade with confidence to their next property.",
      "I will build a strong home buying team, where clients are supported by dedicated analysts, research, and technology.",
    ],
  },
] as const;

export function AboutContent({
  listingCount,
  listingsAsOfDate,
}: {
  listingCount?: number;
  listingsAsOfDate?: string;
}) {
  const [visionLead, visionTail] = SITE_VISION.split(", ");
  const [realEstateLead] = visionTail.split("should finally be fair");

  return (
    <>
      <section aria-label="About HomeUP" className="section-padding bg-white">
        <div className="container-page">
          <FadeInUp className="mx-auto max-w-3xl text-center">
            <Eyebrow>About HomeUP</Eyebrow>
            <h1 className="section-title">
              {visionLead},
              <br />
              {realEstateLead}
              <span className="text-primary-600">should finally be fair.</span>
            </h1>
          </FadeInUp>

          <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-stretch">
            {FOUNDERS.map((founder, index) => {
              const agent = getAgentBySlug(founder.slug);
              if (!agent) return null;

              return (
                <FadeInUp key={founder.slug} delay={0.1 + index * 0.08} className="h-full">
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-primary-600 bg-white">
                    <div className="relative aspect-[5/6] w-full shrink-0 bg-white">
                      <Image
                        src={agent.photo}
                        alt={`${agent.name}, HomeUP co-founder`}
                        fill
                        className="object-cover object-[center_5px]"
                        sizes="(max-width: 1024px) 100vw, 560px"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-8">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="font-bold text-neutral-900">{founder.displayName}</span>
                        <span
                          aria-hidden="true"
                          className="text-lg font-bold leading-none text-neutral-500"
                        >
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
                </FadeInUp>
              );
            })}
          </div>
        </div>
      </section>

      <AboutListingsGoal listingCount={listingCount} asOfDate={listingsAsOfDate} />

      <section aria-label="Meet the team" className="section-padding bg-white">
        <div className="container-page">
          <FadeInUp className="section-header">
            <Eyebrow>Our Team</Eyebrow>
            <h2 className="section-title">CEA-licensed advisors you can trust</h2>
            <p className="section-lead">
              Every HomeUP advisor is CEA-registered with a public registration number.{" "}
              <a
                href={CEA_PUBLIC_REGISTER_URL}
                className="font-semibold text-primary-600 underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Verify CEA licence {CEA_LICENSE} on the CEA Public Register
              </a>
              .
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

      <section aria-label="Company details" className="section-padding bg-neutral-50">
        <div className="container-page">
          <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
            <h2 className="text-sm font-bold text-neutral-900">Company information</h2>
            <dl className="mt-4 grid gap-4 text-sm text-neutral-600 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-neutral-900">CEA-licensed operator</dt>
                <dd className="mt-1 font-normal">C &amp; H Properties Pte Ltd · L3007139C</dd>
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
