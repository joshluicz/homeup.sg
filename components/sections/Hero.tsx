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

const mosaicImages = [
  {
    src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    alt: "Modern Singapore home interior",
  },
  {
    src: "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600&q=80",
    alt: "Happy Singapore homeowner couple",
  },
];

const portraitImage = {
  src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=700&q=85",
  alt: "Professional HomeUP property advisor",
};

const stats = [
  { value: "1,000+", label: "Transactions" },
  { value: "100+",   label: "Families helped" },
  { value: "$3M+",   label: "Commissions saved" },
  { value: "3 mo",   label: "Avg. timeline" },
];

/* ─────────────────────────────────────────
   MOBILE HERO  (<lg)
   Full-width image banner → content block
───────────────────────────────────────── */
function MobileHero() {
  return (
    <section aria-label="Fixed-fee property agents hero" className="bg-white lg:hidden">
      {/* Image banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full overflow-hidden"
        style={{ height: "min(62vw, 300px)" }}
      >
        <Image
          src={portraitImage.src}
          alt={portraitImage.alt}
          fill
          className="object-cover object-[center_12%]"
          priority
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

        {/* Trust chip — bottom left */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/90 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-xs font-bold text-primary-600">✓</span>
          <span className="text-xs font-semibold text-neutral-800">1,000+ transactions</span>
        </div>
      </motion.div>

      {/* Content block */}
      <div className="mx-auto w-full max-w-[1200px] px-8 pb-10 pt-6 sm:px-12">
        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs font-semibold uppercase tracking-widest text-primary-600"
        >
          Fixed-Fee Property Agents · Singapore
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-2 font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight text-neutral-900"
        >
          Sell for more.
          <br />
          <span className="text-primary-600">Save on commissions.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-2 text-base font-medium text-neutral-500"
        >
          Your family fixed-fee agent.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.30 }}
          className="mt-3 text-sm leading-relaxed text-neutral-600"
        >
          Most homeowners give away $10,000–$70,000 in commission. HomeUP charges a
          fixed fee — same full service, radically more honest.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="mt-5"
        >
          <Button size="lg" asChild className="w-full">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="gap-2 justify-center">
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
              Book a Free Call
            </a>
          </Button>
          <p className="mt-2 text-center text-xs text-neutral-400">
            No commitment · Free 45-min planning session
          </p>
        </motion.div>

        {/* Stats — 2×2 grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.46 }}
          className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-5"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl font-extrabold text-neutral-900">{s.value}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   DESKTOP HERO  (lg+)
   Two-column: copy left, mosaic right
───────────────────────────────────────── */
function DesktopHero() {
  return (
    <section
      aria-label="Fixed-fee property agents hero"
      className="relative hidden overflow-x-hidden bg-white lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center"
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-16 px-12 xl:px-20">
        {/* ── Left column ── */}
        <div className="flex-1 py-8" style={{ maxWidth: "520px" }}>
          <motion.p custom={0} initial="hidden" animate="show" variants={fade}
            className="text-sm font-semibold uppercase tracking-widest text-primary-600">
            Fixed-Fee Property Agents · Singapore
          </motion.p>

          <motion.h1 custom={0.1} initial="hidden" animate="show" variants={fade}
            className="mt-3 font-display font-extrabold leading-[1.06] tracking-tight text-neutral-900"
            style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)" }}>
            Sell your home for more.
            <br />
            <span className="text-primary-600">Save on commissions.</span>
          </motion.h1>

          <motion.p custom={0.18} initial="hidden" animate="show" variants={fade}
            className="mt-3 text-lg font-medium text-neutral-500">
            Your family fixed-fee agent.
          </motion.p>

          <motion.p custom={0.26} initial="hidden" animate="show" variants={fade}
            className="mt-3 max-w-md text-base leading-relaxed text-neutral-600">
            Most Singapore homeowners give away $10,000–$70,000 in commission.
            HomeUP charges a fixed fee — same full service, radically more honest.
          </motion.p>

          <motion.div custom={0.34} initial="hidden" animate="show" variants={fade}
            className="mt-6">
            <Button size="lg" asChild>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Book a Free Call
              </a>
            </Button>
            <p className="mt-2 text-xs text-neutral-400">
              No commitment · Free 45-min planning session
            </p>
          </motion.div>

          {/* Stats — 4-col, short labels */}
          <motion.div custom={0.42} initial="hidden" animate="show" variants={fade}
            className="mt-6 grid grid-cols-4 gap-3 border-t border-neutral-100 pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-xl font-extrabold text-neutral-900">{s.value}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right column — photo mosaic ── */}
        <motion.div
          initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.2, ease }}
          className="relative flex-shrink-0 lg:w-[44%]"
        >
          <div
            className="grid grid-cols-2 grid-rows-2 gap-3"
            style={{ height: "min(calc(100svh - 10rem), 480px)" }}
          >
            <div className="overflow-hidden rounded-2xl">
              <Image src={mosaicImages[0].src} alt={mosaicImages[0].alt}
                width={600} height={400}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
            <div className="row-span-2 overflow-hidden rounded-2xl">
              <Image src={portraitImage.src} alt={portraitImage.alt}
                width={700} height={900} priority
                className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105" />
            </div>
            <div className="overflow-hidden rounded-2xl">
              <Image src={mosaicImages[1].src} alt={mosaicImages[1].alt}
                width={600} height={400}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
          </div>

          <div className="mt-3 ml-2 inline-flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-white px-4 py-2.5 shadow-md">
            <span aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
              ✓
            </span>
            <span className="text-xs font-semibold text-neutral-800">
              1,000+ transactions · $3M+ saved
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Hero() {
  return (
    <>
      <MobileHero />
      <DesktopHero />
    </>
  );
}
