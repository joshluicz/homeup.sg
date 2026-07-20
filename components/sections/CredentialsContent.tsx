"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Building2, ShieldCheck } from "lucide-react";
import { AGENTS } from "@/lib/data/agents";
import { CEA_LICENSE, LEGAL_NAME, PARENT_ORG_NAME, PARENT_ORG_UEN } from "@/lib/seo/constants";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

// Only agents who actually carry accolades in lib/data/agents.ts appear in the recognition
// grid — this page is a trust surface, so every claim on it has to trace back to real data
// rather than placeholder copy.
const DECORATED_AGENTS = AGENTS.filter((agent) => (agent.accolades?.length ?? 0) > 0);

const LICENCE_FACTS = [
  {
    icon: ShieldCheck,
    label: "CEA agency licence",
    value: CEA_LICENSE,
    detail: "Every advisor operates under this Council for Estate Agencies licence.",
  },
  {
    icon: Building2,
    label: "Operating entity",
    value: LEGAL_NAME,
    detail: `Part of ${PARENT_ORG_NAME} (UEN ${PARENT_ORG_UEN}).`,
  },
  {
    icon: BadgeCheck,
    label: "Registered advisors",
    value: `${AGENTS.length} CEA-registered`,
    detail: "Individual registration numbers published on every advisor profile.",
  },
] as const;

export function CredentialsContent() {
  return (
    <>
      <section aria-label="Credentials" className="section-padding bg-white">
        <div className="container-page">
          <FadeInUp className="mx-auto max-w-3xl text-center">
            <Eyebrow>Credentials &amp; awards</Eyebrow>
            <h1 className="section-title">
              Every claim we make is one you can{" "}
              <span className="text-primary-600">verify.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Licences, registration numbers and industry recognition — published in full, so you
              never have to take our word for it.
            </p>
          </FadeInUp>

          <StaggerContainer className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
            {LICENCE_FACTS.map((fact) => {
              const Icon = fact.icon;
              return (
                <StaggerItem key={fact.label}>
                  <div className="flex h-full flex-col rounded-2xl border border-border bg-primary-50/40 p-7">
                    <Icon className="h-6 w-6 text-primary-600" aria-hidden />
                    <p className="mt-5 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      {fact.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">{fact.value}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {fact.detail}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      <section aria-label="Recognition" className="section-padding bg-primary-50/30">
        <div className="container-page">
          <FadeInUp className="mx-auto max-w-2xl text-center">
            <Eyebrow>Recognition</Eyebrow>
            <h2 className="section-title">Awards our advisors have earned.</h2>
          </FadeInUp>

          <StaggerContainer className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
            {DECORATED_AGENTS.map((agent) => (
              <StaggerItem key={agent.slug}>
                <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-8">
                  <div className="flex items-center gap-4">
                    <Image
                      src={agent.photo}
                      alt={agent.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">CEA {agent.cea}</p>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {agent.accolades?.map((accolade) => (
                      <li key={accolade} className="flex gap-3 text-sm leading-relaxed">
                        <BadgeCheck
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary-600"
                          aria-hidden
                        />
                        <span className="text-muted-foreground">{accolade}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/agents/${agent.slug}`}
                    className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View full profile
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeInUp className="mx-auto mt-12 max-w-2xl text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Advisor registration numbers can be checked against the public CEA register at{" "}
              <a
                href="https://www.cea.gov.sg/aceas/public-register/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 underline underline-offset-4 hover:text-primary-700"
              >
                cea.gov.sg
              </a>
              .
            </p>
          </FadeInUp>
        </div>
      </section>
    </>
  );
}
