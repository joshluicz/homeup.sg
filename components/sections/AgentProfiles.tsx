"use client";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const agents = [
  {
    name: "Dennis Lim",
    cea: "R055990G",
    bio: "Straight-talking guidance shaped by real ownership and upgrade experience, including private and landed homes in Singapore.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "Yeo Tong Boon",
    cea: "R069651E",
    bio: "Passionate about helping homeowners plan their next move with clarity, structure, and confidence.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "Edmund Lee",
    cea: "R023385H",
    bio: "A steady hand with three decades of experience guiding HDB homeowners through resale decisions calmly and methodically.",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "Kenji Ching",
    cea: "R070948I",
    bio: "Patient, practical support for homeowners navigating resale or their first upgrade.",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "Olivia Neo",
    cea: "R072836A",
    bio: "A friendly law diploma graduate, dedicated to guiding buyers and sellers on a smooth and transparent property journey.",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80",
  },
];

export function AgentProfiles() {
  return (
    <section aria-label="HomeUP agent profiles" className="section-padding bg-neutral-50" id="agents">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>The Team</Eyebrow>
          <h2 className="section-title">Advisors with perspective,<br />not sales targets</h2>
          <p className="section-lead">
            HomeUP advisors combine deep transaction experience as homeowners
            and investors themselves, bringing grounded, practical guidance
            across upgrades, timing decisions, and long-term planning.
          </p>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          {agents.map((agent) => (
            <StaggerItem key={agent.cea}>
              <article className="text-center">
                {/* Photo */}
                <div className="relative mx-auto mb-4 h-24 w-24">
                  <Image
                    src={agent.photo}
                    alt={`${agent.name}, HomeUP property advisor`}
                    width={96}
                    height={96}
                    className="h-full w-full rounded-full border-2 border-neutral-200 object-cover shadow-sm"
                  />
                  {/* Online indicator dot */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary-500"
                  />
                </div>

                <h3 className="m-0 font-display text-base font-semibold text-neutral-900">
                  {agent.name}
                </h3>
                <p className="mt-1 font-mono text-xs tracking-wide text-neutral-400">
                  {agent.cea}
                </p>
                <p className="mt-3 text-sm leading-normal text-neutral-600">{agent.bio}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.2}>
          <p className="mt-10 text-center text-xs text-neutral-400">
            All advisors are CEA-registered under C &amp; H Properties Pte Ltd · CEA Licence: L3007139C
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}
