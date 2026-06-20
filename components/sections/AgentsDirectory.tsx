"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AGENTS } from "@/lib/data/agents";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

export function AgentsDirectory() {
  return (
    <section aria-label="HOMEUP agents directory" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Our Agents</Eyebrow>
          <h1 className="section-title">Meet the HomeUP team</h1>
          <p className="section-lead">
            CEA-licensed advisors who combine real transaction experience with a fixed-fee model.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <StaggerItem key={agent.slug}>
              <Link
                href={`/agents/${agent.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary-600/40 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                  <Image
                    src={agent.photo}
                    alt={`${agent.name}, CEA ${agent.cea}, HomeUP property advisor`}
                    fill
                    className="object-cover object-[center_5px] transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-sm font-bold text-neutral-900">{agent.name}</h2>
                  <p className="mt-1 text-sm font-normal text-neutral-400">{agent.cea}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600">
                    View profile
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.15}>
          <p className="mt-10 text-center text-xs text-neutral-400">
            All advisors are CEA-registered under C &amp; H Properties Pte Ltd · CEA
            Licence: L3007139C
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}
