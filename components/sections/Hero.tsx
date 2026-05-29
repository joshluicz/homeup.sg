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
  { value: "100+", label: "Families helped" },
  { value: "$3M+", label: "Commission saved" },
  { value: "3 mo", label: "Focused engagement" },
];

export function Hero() {
  return (
    <section
      aria-label="Fixed-fee property agents hero"
      className="relative overflow-hidden bg-white lg:h-[calc(100svh-4rem)]"
    >
      <div className="container-page flex h-full flex-col justify-center gap-6 py-12 lg:flex-row lg:items-center lg:gap-16 lg:py-8">
        {/* ── Left column ── */}
        <div className="flex-1 lg:max-w-[540px]">
          {/* Brand descriptor */}
          <motion.p
            custom={0}
            initial="hidden"
            animate="show"
            variants={fade}
            className="text-sm font-semibold uppercase tracking-widest text-primary-600"
          >
            Fixed-Fee Property Agents · Singapore
          </motion.p>

          {/* H1 */}
          <motion.h1
            custom={0.1}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-3 font-display font-bold leading-[1.08] tracking-tight text-neutral-900"
            style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)" }}
          >
            Sell your home for more.
            <br />
            <span className="text-primary-600">Save on commissions.</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            custom={0.18}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-3 text-lg font-medium text-neutral-500"
          >
            Your family fixed-fee agent.
          </motion.p>

          {/* Body copy */}
          <motion.p
            custom={0.26}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-4 text-base leading-relaxed text-neutral-600"
          >
            Most Singapore homeowners give away $10,000–$70,000 in agent
            commission. HomeUP charges a fixed fee — same full service,
            radically more honest.
          </motion.p>

          {/* CTA */}
          <motion.div
            custom={0.36}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-7"
          >
            <Button size="lg" asChild>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Book a Free Call
              </a>
            </Button>
          </motion.div>

          <motion.p
            custom={0.44}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-3 text-xs text-neutral-400"
          >
            No commitment. Free 45-min planning session.
          </motion.p>

          {/* Stats row */}
          <motion.div
            custom={0.52}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-7 grid grid-cols-4 gap-4 border-t border-neutral-100 pt-6"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-xl font-bold text-neutral-900">{s.value}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right column — photo mosaic (desktop) ── */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.2, ease }}
          className="relative hidden flex-shrink-0 lg:block lg:w-[44%]"
        >
          <div
            className="relative grid grid-cols-2 grid-rows-2 gap-3"
            style={{ height: "min(calc(100svh - 8rem), 500px)" }}
          >
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={mosaicImages[0].src}
                alt={mosaicImages[0].alt}
                width={600}
                height={400}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="row-span-2 overflow-hidden rounded-2xl">
              <Image
                src={portraitImage.src}
                alt={portraitImage.alt}
                width={700}
                height={900}
                className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={mosaicImages[1].src}
                alt={mosaicImages[1].alt}
                width={600}
                height={400}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>

          <div className="mt-3 ml-2 inline-flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-white px-4 py-2.5 shadow-md">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700"
            >
              ✓
            </span>
            <span className="text-xs font-semibold text-neutral-800">
              1,000+ transactions · $3M+ saved
            </span>
          </div>
        </motion.div>

        {/* ── Mobile image ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="relative w-full overflow-hidden rounded-2xl lg:hidden"
          style={{ height: "clamp(180px, 40vw, 280px)" }}
        >
          <Image
            src={portraitImage.src}
            alt={portraitImage.alt}
            fill
            className="object-cover object-[center_15%]"
            priority
            sizes="100vw"
          />
        </motion.div>
      </div>
    </section>
  );
}
