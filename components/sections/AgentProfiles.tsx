"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AGENTS } from "@/lib/data/agents";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

interface AgentProfilesProps {
  showViewAll?: boolean;
}

export function AgentProfiles({ showViewAll = true }: AgentProfilesProps) {
  return (
    <section aria-label="HOMEUP agent profiles" className="section-padding bg-neutral-50" id="agents">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>The Team</Eyebrow>
          <h2 className="section-title">
            Advisors with perspective,
            <br />
            not sales targets
          </h2>
          <p className="section-lead">
            HOMEUP advisors combine deep transaction experience as homeowners and
            investors themselves, bringing grounded, practical guidance across
            upgrades, timing decisions, and long-term planning.
          </p>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          {AGENTS.map((agent) => (
            <StaggerItem key={agent.cea}>
              <Link href={`/agents/${agent.slug}`} className="group block text-center">
                <div className="relative mx-auto mb-4 h-28 w-28">
                  <Image
                    src={agent.photo}
                    alt={`${agent.name}, HOMEUP property advisor`}
                    width={112}
                    height={112}
                    className="h-full w-full rounded-full border-2 border-neutral-200 object-cover object-top shadow-sm transition group-hover:border-primary-300"
                  />
                </div>

                <h3 className="m-0 font-display text-sm font-bold text-neutral-900 group-hover:text-primary-700">
                  {agent.name}
                </h3>
                <p className="mt-1 text-sm font-normal tracking-wide text-neutral-400">
                  {agent.cea}
                </p>
                <p className="mt-3 text-sm font-normal leading-normal text-neutral-600">
                  {agent.bio}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {showViewAll && (
          <FadeInUp delay={0.15}>
            <div className="mt-8 text-center">
              <Link
                href="/agents"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
              >
                View all agents
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeInUp>
        )}

        <FadeInUp delay={0.2}>
          <p className="mt-10 text-center text-xs text-neutral-400">
            All advisors are CEA-registered under C &amp; H Properties Pte Ltd · CEA
            Licence: L3007139C
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}
