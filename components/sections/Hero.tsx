"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const WA = "https://wa.me/6580877015";
const ease = [0.22, 1, 0.36, 1] as const;

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease },
  }),
};

const agentStats = [
  { value: "800+", label: "HDB Resale",     agent: "Edmund Lee" },
  { value: "220+", label: "Condo & Landed", agent: "Dennis Lim" },
];

export function Hero() {
  return (
    <section
      aria-label="Fixed-fee property agents hero"
      className="bg-white lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 px-8 py-12 sm:px-12 lg:flex-row lg:gap-16 lg:py-8 xl:px-20">

        {/* ── Text content (left on desktop, top on mobile) ── */}
        <div className="w-full flex-1 lg:max-w-[520px]">
          <motion.p
            custom={0} initial="hidden" animate="show" variants={fade}
            className="text-xs font-semibold uppercase tracking-widest text-primary-600 sm:text-sm"
          >
            Fixed-Fee Property Agents · Singapore
          </motion.p>

          <motion.h1
            custom={0.1} initial="hidden" animate="show" variants={fade}
            className="mt-3 font-display font-extrabold leading-[1.06] tracking-tight text-neutral-900"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            Sell your home for more.
            <br />
            <span className="text-primary-600">Save on commissions.</span>
          </motion.h1>

          <motion.p
            custom={0.18} initial="hidden" animate="show" variants={fade}
            className="mt-3 text-base font-medium text-neutral-500 sm:text-lg"
          >
            Your family fixed-fee agent.
          </motion.p>

          <motion.p
            custom={0.26} initial="hidden" animate="show" variants={fade}
            className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600 sm:text-base"
          >
            Most Singapore homeowners give away $10,000–$70,000 in commission.
            HomeUP charges a fixed fee — same full service, radically more honest.
          </motion.p>

          <motion.div
            custom={0.34} initial="hidden" animate="show" variants={fade}
            className="mt-6"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="justify-center gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Book a Free Call
              </a>
            </Button>
            <p className="mt-2 text-xs text-neutral-400 sm:text-left text-center">
              No commitment · Free 45-min planning session
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            custom={0.42} initial="hidden" animate="show" variants={fade}
            className="mt-6 border-t border-neutral-100 pt-5"
          >
            <div className="flex items-center gap-5">
              <div className="shrink-0">
                <p className="font-display text-xl font-extrabold text-neutral-900">1,000+</p>
                <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">Transactions</p>
              </div>
              <div className="h-8 w-px shrink-0 bg-neutral-200" />
              <div className="flex flex-wrap gap-2">
                {agentStats.map((s) => (
                  <span
                    key={s.agent}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1"
                  >
                    <span className="font-display text-sm font-bold text-neutral-900">{s.value}</span>
                    <span className="text-[11px] text-neutral-500">{s.label}</span>
                    <span className="text-[11px] font-medium text-primary-600">· {s.agent}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Team photo (right on desktop, bottom on mobile) ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease }}
          className="w-full lg:w-[46%] lg:shrink-0"
        >
          <div className="relative">
            <Image
              src="/images/team-group.png"
              alt="The HomeUP team — five agents giving thumbs up"
              width={920}
              height={614}
              priority
              className="w-full object-contain"
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
            {/* Trust chip */}
            <div className="absolute bottom-0 right-0 inline-flex items-center gap-2 rounded-xl border border-neutral-100 bg-white px-3 py-2 shadow-md sm:px-4 sm:py-2.5">
              <span
                aria-hidden="true"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700"
              >
                ✓
              </span>
              <span className="text-xs font-semibold text-neutral-800">
                1,000+ transactions
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
