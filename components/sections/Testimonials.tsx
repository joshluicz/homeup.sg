"use client";

import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import {
  HOMEUP_TESTIMONIALS,
  splitTestimonialsIntoColumns,
} from "@/lib/data/testimonials";
import { motion } from "motion/react";

const [firstColumn, secondColumn, thirdColumn] =
  splitTestimonialsIntoColumns(HOMEUP_TESTIMONIALS);

const DESKTOP_DURATIONS = [28, 34, 31] as const;
const MOBILE_DURATIONS = [58, 68, 62] as const;

function useIsMobileLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function Testimonials() {
  const isMobile = useIsMobileLayout();
  const durations = isMobile ? MOBILE_DURATIONS : DESKTOP_DURATIONS;

  return (
    <section
      id="testimonials"
      aria-label="Client testimonials"
      className="section-padding bg-neutral-50"
    >
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="section-header mx-auto max-w-2xl text-center"
        >
          <Eyebrow>Verified HOMEUP clients</Eyebrow>
          <h2 className="section-title">
            What do HomeUP clients say about fixed-fee agents?
          </h2>
          <p className="section-lead">
            Homeowners share their experience: transparent pricing, professional
            service, and real savings compared to percentage commission.
          </p>
        </motion.div>

        <div className="relative mt-10 h-[min(520px,70vh)] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] sm:h-[740px]">
          <div className="flex h-full gap-2 sm:gap-4 md:gap-6">
            <TestimonialsColumn
              testimonials={firstColumn}
              duration={durations[0]}
            />
            <TestimonialsColumn
              testimonials={secondColumn}
              duration={durations[1]}
            />
            <TestimonialsColumn
              testimonials={thirdColumn}
              duration={durations[2]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
