"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import {
  HOMEUP_TESTIMONIALS,
  splitTestimonialsIntoColumns,
  type TestimonialColumnItem,
} from "@/lib/data/testimonials";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// ── Split into featured (has photo) and scrolling (text-only) ──────────────
const featuredTestimonials = HOMEUP_TESTIMONIALS.filter((t) => t.photo);
const scrollingTestimonials = HOMEUP_TESTIMONIALS.filter((t) => !t.photo);

const [firstColumn, secondColumn, thirdColumn] =
  splitTestimonialsIntoColumns(scrollingTestimonials);

const DESKTOP_DURATIONS = [28, 34, 31] as const;
const MOBILE_DURATIONS = [58, 68, 62] as const;

const SOURCE_STYLES: Record<string, string> = {
  Google: "text-blue-600",
  Facebook: "text-blue-500",
};

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

function StarRating() {
  return (
    <div className="mb-2 flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-amber-400 text-amber-400 sm:h-4 sm:w-4"
        />
      ))}
    </div>
  );
}

function FeaturedTestimonialCard({ item }: { item: TestimonialColumnItem }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
    >
      {/* Photo — fixed-height banner, full width */}
      {item.photo && (
        <div className="relative h-48 w-full overflow-hidden sm:h-56">
          <img
            src={item.photo}
            alt={`${item.name} with HomeUP agent`}
            className="h-full w-full object-cover object-center"
          />
          {/* fade into card body */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-6">
        <StarRating />
        <p className="text-sm leading-relaxed text-neutral-700 sm:text-base">
          &ldquo;{item.text}&rdquo;
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
            <p className="text-xs text-neutral-500">{item.role}</p>
          </div>
          {item.source && (
            <span
              className={cn(
                "text-xs font-medium",
                SOURCE_STYLES[item.source] ?? "text-neutral-400",
              )}
            >
              via {item.source}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
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
            Real clients.{" "}
            <span className="text-primary-600">Real savings.</span>
          </h2>
          <p className="section-lead">
            Homeowners share their experience with HomeUP — transparent pricing,
            professional service, and thousands saved versus percentage commission.
          </p>
        </motion.div>

        {/* ── Featured photo testimonials ─────────────────────────────── */}
        {featuredTestimonials.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6">
            {featuredTestimonials.map((item) => (
              <FeaturedTestimonialCard key={`${item.name}-${item.role}`} item={item} />
            ))}
          </div>
        )}

        {/* ── Scrolling text testimonials ────────────────────────────── */}
        <div className="relative mt-6 h-[min(520px,70vh)] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] sm:mt-8 sm:h-[600px]">
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
