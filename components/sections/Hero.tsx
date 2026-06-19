"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Typewriter } from "@/components/ui/typewriter";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsAppUrlFor } from "@/lib/whatsapp";

const WA = whatsAppUrlFor("heroHome");
const ease = [0.22, 1, 0.36, 1] as const;
const COUNT_DURATION = 2.5;

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease },
  }),
};

const breakdown = [
  { key: "hdb" as const, target: 860, label: "HDB" },
  { key: "condo" as const, target: 260, label: "Condo & Landed" },
];

const AGENT_COUNT = 7;

const agents = [
  { src: "/images/agent-dennis.png", name: "Dennis" },
  { src: "/images/agent-tong-boon.png", name: "Tong Boon" },
  { src: "/images/agent-edmund.png", name: "Edmund" },
  { src: "/images/agent-olivia.png", name: "Olivia" },
  { src: "/images/agent-kenji.png", name: "Kenji" },
  { src: "/images/agent-isaac.png", name: "Isaac" },
];

function StatsCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [total, setTotal] = useState(0);
  const [hdb, setHdb] = useState(0);
  const [condo, setCondo] = useState(0);
  const [showPlus, setShowPlus] = useState(false);

  useEffect(() => {
    if (!inView) return;
    setShowPlus(false);
    const controls = [
      animate(0, 1000, {
        duration: COUNT_DURATION,
        ease: "linear",
        onUpdate: (v) => setTotal(Math.round(v)),
        onComplete: () => setShowPlus(true),
      }),
      animate(0, 860, {
        duration: COUNT_DURATION,
        ease: "linear",
        onUpdate: (v) => setHdb(Math.round(v)),
      }),
      animate(0, 260, {
        duration: COUNT_DURATION,
        ease: "linear",
        onUpdate: (v) => setCondo(Math.round(v)),
      }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [inView]);

  const breakdownValues = { hdb, condo };

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-[0_2px_20px_rgba(0,0,0,0.07)] sm:px-6 sm:py-5"
    >
      <noscript>
        <p className="font-display text-4xl font-extrabold text-primary-600 sm:text-5xl">1,000+</p>
        <p className="mt-1.5 text-neutral-700">
          <span className="font-display text-xl font-bold sm:text-2xl">Transactions</span>
          <span className="text-sm font-medium"> closed</span>
        </p>
        <p className="mt-3 text-sm text-neutral-600">860+ HDB · 260+ Condo &amp; Landed</p>
      </noscript>
      {/* Mobile: stacked; sm+: side-by-side */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {/* Primary stat */}
        <div className="shrink-0">
          <p className="font-display text-4xl font-extrabold leading-none tabular-nums text-primary-600 sm:text-5xl">
            {total.toLocaleString()}
            {showPlus && "+"}
          </p>
          <p className="mt-1.5 leading-tight text-neutral-700">
            <span className="font-display text-xl font-bold sm:text-2xl">Transactions</span>
            <span className="text-sm font-medium"> closed</span>
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-neutral-400">
            CEA records · Dennis, Tongboon, Edmund
          </p>
        </div>

        <div className="hidden h-14 w-px shrink-0 bg-neutral-200 sm:block sm:h-16" aria-hidden="true" />

        {/* Breakdown */}
        <div className="flex flex-row gap-4 sm:flex-col sm:gap-2.5">
          {breakdown.map((b) => (
            <div key={b.key} className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tabular-nums text-neutral-800 sm:text-2xl md:text-3xl">
                {breakdownValues[b.key].toLocaleString()}
                {showPlus && "+"}
              </span>
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentAvatars({ className = "" }: { className?: string }) {
  const overflowCount = AGENT_COUNT - agents.length;

  return (
    <div className={`flex items-center gap-2.5 ${className}`.trim()}>
      <div className="flex -space-x-2.5" aria-label={`${AGENT_COUNT} CEA-licensed agents`}>
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-sm"
          >
            <Image
              src={agent.src}
              alt={agent.name}
              fill
              className="object-cover object-center"
            />
          </div>
        ))}
        {overflowCount > 0 && (
          <div
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary-50 text-xs font-bold tabular-nums text-primary-700 shadow-sm"
            aria-hidden="true"
          >
            +{overflowCount}
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-neutral-600">
        {AGENT_COUNT} CEA-licensed agents
      </span>
    </div>
  );
}

function SocialProofRow() {
  return (
    <div className="flex justify-center lg:justify-start">
      <AgentAvatars />
    </div>
  );
}

export function Hero() {
  return (
    <section aria-label="Fixed-fee property agents hero" className="bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-8 px-8 py-12 sm:px-12 lg:flex-row lg:items-start lg:gap-12 lg:py-16 xl:px-20">

        {/* Left: copy */}
        <div className="w-full shrink-0 lg:w-[44%]">
          <motion.h1
            custom={0} initial="hidden" animate="show" variants={fade}
            className="font-display font-extrabold leading-[1.06] tracking-tight text-neutral-900 text-[clamp(1.2rem,7vw,3.2rem)] lg:text-[clamp(1.5rem,3.2vw,2.4rem)]"
          >
            Sell Your Home for More.
            <br />
            <span className="inline-flex flex-nowrap items-baseline gap-x-[0.25em] whitespace-nowrap text-primary-600">
              <span>Save on</span>
              <Typewriter
                text={["Time.", "Hassle.", "Commissions."]}
                speed={55}
                waitTime={1800}
                deleteSpeed={35}
                initialDelay={400}
                cursorChar="|"
                cursorClassName="ml-0.5 font-normal text-primary-600"
                className="inline min-w-[11.5ch] text-left text-primary-600"
              />
            </span>
          </motion.h1>

          <motion.p
            custom={0.08} initial="hidden" animate="show" variants={fade}
            className="mt-3 text-sm font-medium leading-normal text-neutral-500 [font-feature-settings:'liga'_off,'calt'_off]"
          >
            Fixed Fee Agents | Dedicated to Families
          </motion.p>

          <motion.p
            custom={0.14} initial="hidden" animate="show" variants={fade}
            className="mt-4 max-w-md text-base font-normal leading-relaxed text-neutral-600 sm:text-lg"
          >
            Most Singapore homeowners give away $10,000–$70,000 in commission.
            HomeUP charges a fixed fee for the same full service.
          </motion.p>

          <motion.div
            custom={0.22} initial="hidden" animate="show" variants={fade}
            className="mt-6"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="justify-center gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Book a Free Call
              </a>
            </Button>
            <p className="mt-2 text-sm font-normal text-neutral-400">
              No commitment · Free 30-min planning session
            </p>
          </motion.div>
        </div>

        {/* Right: visuals — stats first on desktop to align with headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease }}
          className="flex w-full flex-col gap-4 lg:-mt-2 lg:flex-1 lg:gap-3"
        >
          <div className="order-2 w-full lg:order-1">
            <StatsCard />
          </div>

          <div className="order-1 w-full lg:order-2 lg:-mb-5 lg:-mt-8">
            <Image
              src="/images/team-group.png"
              alt="The HomeUP team, CEA-licensed property agents in Singapore"
              width={920}
              height={614}
              priority
              className="block w-full object-contain object-top"
              sizes="(max-width: 1024px) 100vw, 56vw"
            />
          </div>

          <div className="order-3">
            <SocialProofRow />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
