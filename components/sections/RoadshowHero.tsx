"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";

const Typewriter = dynamic(
  () => import("@/components/ui/typewriter").then((m) => ({ default: m.Typewriter })),
  {
    ssr: false,
    loading: () => (
      <span className="inline min-w-[11.5ch] text-left text-primary-600" aria-hidden="true" />
    ),
  },
);

const ease = [0.22, 1, 0.36, 1] as const;
const COUNT_DURATION = 2.5;

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease },
  }),
};

const breakdown = [
  { key: "hdb" as const, label: "HDB" },
  { key: "condo" as const, label: "Condo & Landed" },
];

const agents = [
  { src: "/images/agent-dennis.png", name: "Dennis" },
  { src: "/images/agent-tong-boon.png", name: "Tong Boon" },
  { src: "/images/agent-edmund.png", name: "Edmund" },
  { src: "/images/agent-olivia.png", name: "Olivia" },
  { src: "/images/agent-kenji.png", name: "Kenji" },
  { src: "/images/agent-isaac.png", name: "Isaac" },
];

interface RoadshowHeroProps {
  videoSrc: string;
}

function StatsCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(0);
  const [hdb, setHdb] = useState(0);
  const [condo, setCondo] = useState(0);
  const [showPlus, setShowPlus] = useState(false);

  useEffect(() => {
    let controls: ReturnType<typeof animate>[] = [];
    let loopTimer: ReturnType<typeof window.setTimeout> | null = null;

    function startCount() {
      setShowPlus(false);
      setTotal(0);
      setHdb(0);
      setCondo(0);
      if (loopTimer) {
        window.clearTimeout(loopTimer);
        loopTimer = null;
      }
      controls.forEach((control) => control.stop());
      controls = [
        animate(0, 1000, {
          duration: COUNT_DURATION,
          ease: "linear",
          onUpdate: (value) => setTotal(Math.round(value)),
          onComplete: () => {
            setShowPlus(true);
            loopTimer = window.setTimeout(startCount, 3500);
          },
        }),
        animate(0, 860, {
          duration: COUNT_DURATION,
          ease: "linear",
          onUpdate: (value) => setHdb(Math.round(value)),
        }),
        animate(0, 260, {
          duration: COUNT_DURATION,
          ease: "linear",
          onUpdate: (value) => setCondo(Math.round(value)),
        }),
      ];
    }

    if ((window as unknown as Record<string, unknown>).__homeupLoaded) {
      startCount();
    } else {
      window.addEventListener("homeup:loaded", startCount, { once: true });
    }

    return () => {
      window.removeEventListener("homeup:loaded", startCount);
      if (loopTimer) window.clearTimeout(loopTimer);
      controls.forEach((control) => control.stop());
    };
  }, []);

  const breakdownValues = { hdb, condo };

  return (
    <div
      ref={ref}
      className="h-[108px] w-[460px] rounded-2xl border border-white/10 bg-neutral-950 px-5 py-4 text-white shadow-[0_24px_70px_rgba(3,7,18,0.34),0_0_0_1px_rgba(0,166,90,0.14)]"
    >
      <div className="flex items-center gap-4">
        <div className="w-[170px] shrink-0">
          <p className="w-[170px] font-display text-4xl font-extrabold leading-none tabular-nums text-[#00d47e] xl:text-5xl">
            {total.toLocaleString("en-SG")}
            {showPlus && "+"}
          </p>
          <p className="mt-1.5 leading-tight text-white">
            <span className="font-display text-xl font-bold xl:text-2xl">Transactions</span>
          </p>
        </div>

        <div className="h-16 w-px shrink-0 bg-white/15" aria-hidden="true" />

        <div className="flex w-[214px] min-w-0 flex-col gap-2">
          {breakdown.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span className="w-[78px] font-display text-2xl font-bold tabular-nums text-white xl:text-3xl">
                {breakdownValues[item.key].toLocaleString("en-SG")}
                {showPlus && "+"}
              </span>
              <span className="rounded-full bg-[#00a65a] px-2.5 py-0.5 text-xs font-semibold leading-tight text-white ring-1 ring-white/15">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoadshowVideo({ videoSrc }: RoadshowHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsInteraction, setNeedsInteraction] = useState(false);

  useEffect(() => {
    const playPromise = videoRef.current?.play();
    playPromise?.catch(() => setNeedsInteraction(true));
  }, []);

  return (
    <div className="relative mx-auto h-[min(86dvh,760px)] max-h-[calc(100dvh-2rem)] aspect-[9/16] overflow-hidden rounded-[2rem] border border-white/80 bg-neutral-950 shadow-[0_34px_100px_rgba(0,105,58,0.32)] ring-2 ring-[#00a65a]/25">
      <video
        ref={videoRef}
        src={videoSrc}
        title="HomeUP roadshow display video"
        autoPlay
        loop
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
      />
      {needsInteraction && (
        <button
          type="button"
          onClick={() => {
            setNeedsInteraction(false);
            void videoRef.current?.play();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/45 px-8 text-center text-xl font-bold text-white"
        >
          Click once to play video with sound
        </button>
      )}
    </div>
  );
}

export function RoadshowHero(props: RoadshowHeroProps) {
  useEffect(() => {
    document.body.classList.add("homeup-roadshow-display");
    return () => document.body.classList.remove("homeup-roadshow-display");
  }, []);

  return (
    <main id="homeup-roadshow-display" className="h-[100dvh] overflow-hidden bg-white">
      <style jsx global>{`
        body.homeup-roadshow-display a[href*="wa.me"],
        body.homeup-roadshow-display a[href*="whatsapp"] {
          display: none !important;
        }
      `}</style>
      <section aria-label="HomeUP roadshow display" className="relative flex h-full items-center">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#e4faee_0%,#f8fff9_40%,#d8f7e7_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[56%] bg-[linear-gradient(110deg,rgba(0,143,82,0.26),rgba(0,166,90,0.12)_48%,transparent_82%)]" />
        <div className="absolute -left-32 top-[-18%] h-[30rem] w-[30rem] rounded-full bg-[#008f52]/35 blur-3xl" />
        <div className="absolute bottom-[-22%] right-[18%] h-[34rem] w-[34rem] rounded-full bg-[#00a65a]/28 blur-3xl" />
        <div className="absolute right-[-10%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-sky-100/55 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.9),transparent_30%),radial-gradient(circle_at_74%_52%,rgba(0,143,82,0.14),transparent_34%)]" />
        <div className="relative mx-auto grid h-full w-full max-w-[1360px] grid-cols-[minmax(520px,0.98fr)_1.02fr] items-center gap-8 px-8 py-4 2xl:px-12">
          <div className="flex min-w-0 flex-col items-center text-center">
            <motion.div
              custom={0}
              initial="hidden"
              animate="show"
              variants={fade}
              className="-mt-10 mb-8"
            >
              <Image
                src="/images/homeup-logo-wordmark.svg"
                alt="HomeUP"
                width={300}
                height={64}
                priority
                unoptimized
                className="h-auto w-[260px] drop-shadow-[0_10px_20px_rgba(15,23,42,0.08)] xl:w-[300px]"
              />
            </motion.div>

            <motion.h1
              custom={0.06}
              initial="hidden"
              animate="show"
              variants={fade}
              className="max-w-2xl font-display text-[clamp(2.45rem,4vw,4.75rem)] font-extrabold leading-[0.96] tracking-tight text-neutral-950"
            >
              <span className="whitespace-nowrap">
                Most agents take <span className="text-red-600">2%</span>.
              </span>
              <br />
              We charge a <span className="text-[#008f52]">flat fee</span>.
            </motion.h1>

            <motion.div
              custom={0.14}
              initial="hidden"
              animate="show"
              variants={fade}
              className="mt-8 max-w-xl"
            >
              <StatsCard />
            </motion.div>

            <div className="mt-16 flex flex-col items-center">
              <motion.h2
                custom={0.22}
                initial="hidden"
                animate="show"
                variants={fade}
                className="font-display text-[clamp(1.85rem,3.15vw,3.45rem)] font-extrabold leading-[1] tracking-tight text-neutral-900"
              >
                Sell Your Home for More.
                <br />
                <span className="inline-flex flex-nowrap items-baseline gap-x-[0.25em] whitespace-nowrap text-[#008f52]">
                  <span>Save on</span>
                  <Typewriter
                    text={["Time.", "Hassle.", "Commissions."]}
                    speed={55}
                    waitTime={1800}
                    deleteSpeed={35}
                    initialDelay={400}
                    cursorChar="|"
                    cursorClassName="ml-0.5 font-normal text-[#008f52]"
                    className="inline min-w-[11.5ch] text-left text-[#008f52]"
                  />
                </span>
              </motion.h2>

              <motion.div
                custom={0.3}
                initial="hidden"
                animate="show"
                variants={fade}
                className="mt-8 flex -space-x-2"
                aria-label={`${agents.length} HomeUP agents`}
              >
                {agents.map((agent) => (
                  <div
                    key={agent.name}
                    className="relative h-14 w-14 overflow-hidden rounded-full border-[3px] border-white bg-neutral-100 shadow-[0_10px_28px_rgba(15,23,42,0.18)] ring-1 ring-neutral-950/10"
                  >
                    <Image
                      src={agent.src}
                      alt={agent.name}
                      fill
                      sizes="56px"
                      className="object-cover object-center"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.18, ease }}
            className="min-w-0"
          >
            <RoadshowVideo {...props} />
          </motion.div>
        </div>
      </section>
    </main>
  );
}
