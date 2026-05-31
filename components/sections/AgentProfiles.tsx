"use client";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const agents = [
  {
    name: "Dennis Lim",
    cea: "R055990G",
    bio: "Straight-talking guidance shaped by real ownership and upgrade experience, including private and landed homes in Singapore.",
    photo: "/images/agent-dennis.png",
  },
  {
    name: "Yeo Tong Boon",
    cea: "R069651E",
    bio: "Passionate about helping homeowners plan their next move with clarity, structure, and confidence.",
    photo: "/images/agent-tong-boon.png",
  },
  {
    name: "Edmund Lee",
    cea: "R023385H",
    bio: "A steady hand with three decades of experience guiding HDB homeowners through resale decisions calmly and methodically.",
    photo: "/images/agent-edmund.png",
  },
  {
    name: "Kenji Ching",
    cea: "R070948I",
    bio: "Patient, practical support for homeowners navigating resale or their first upgrade.",
    photo: "/images/agent-kenji.png",
  },
  {
    name: "Olivia Neo",
    cea: "R072836A",
    bio: "A friendly law diploma graduate, dedicated to guiding buyers and sellers on a smooth and transparent property journey.",
    photo: "/images/agent-olivia.png",
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
                <div className="relative mx-auto mb-4 h-28 w-28">
                  <Image
                    src={agent.photo}
                    alt={`${agent.name}, HomeUP property advisor`}
                    width={112}
                    height={112}
                    className="h-full w-full rounded-full border-2 border-neutral-200 object-cover object-top shadow-sm"
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
