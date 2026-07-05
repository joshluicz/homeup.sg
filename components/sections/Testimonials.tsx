"use client";

import { useEffect, useRef, useState } from "react";
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
          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
        />
      ))}
    </div>
  );
}

function PhotoTestimonialCard({ item }: { item: TestimonialColumnItem }) {
  return (
    <article className="mr-4 w-64 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:mr-6 sm:w-72">
      {/* Fixed-height photo */}
      {item.photo && (
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={item.photo}
            alt={`${item.name} with HomeUP agent`}
            className="h-full w-full object-cover"
            style={{ objectPosition: item.photoPosition ?? "center" }}
          />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        </div>
      )}
      {/* Text */}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-neutral-900">{item.name}</p>
          </div>
          {item.source && (
            <span className={cn("text-[10px] font-medium", SOURCE_STYLES[item.source] ?? "text-neutral-400")}>
              via {item.source}
            </span>
          )}
        </div>
        <StarRating />
        <p className="line-clamp-4 text-xs leading-relaxed text-neutral-700 sm:text-sm">
          &ldquo;{item.text}&rdquo;
        </p>
      </div>
    </article>
  );
}

// pixels per second
const MARQUEE_SPEED = 25;

function HorizontalMarquee({ items }: { items: TestimonialColumnItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const touchingRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartPosRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const animate = (time: number) => {
      if (lastTimeRef.current && !touchingRef.current) {
        const delta = (time - lastTimeRef.current) / 1000;
        const copyWidth = track.scrollWidth / 2;
        posRef.current += MARQUEE_SPEED * delta;
        if (posRef.current >= copyWidth) posRef.current -= copyWidth;
        if (posRef.current < 0) posRef.current += copyWidth;
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchingRef.current = true;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartPosRef.current = posRef.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!trackRef.current) return;
    const delta = touchStartXRef.current - e.touches[0].clientX;
    const copyWidth = trackRef.current.scrollWidth / 2;
    let newPos = touchStartPosRef.current + delta;
    if (newPos >= copyWidth) newPos -= copyWidth;
    if (newPos < 0) newPos += copyWidth;
    posRef.current = newPos;
    trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
  };

  const handleTouchEnd = () => {
    touchingRef.current = false;
    lastTimeRef.current = 0; // reset so RAF resumes smoothly
  };

  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={trackRef} className="flex will-change-transform">
        {doubled.map((item, i) => (
          <PhotoTestimonialCard key={`${i}-${item.name}`} item={item} />
        ))}
      </div>
    </div>
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
          initial={false}
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
            Homeowners share their experience with HomeUP: transparent pricing,
            professional service, and thousands saved versus percentage commission.
          </p>
        </motion.div>

        {/* ── Horizontal photo marquee ───────────────────────────────── */}
        {featuredTestimonials.length > 0 && (
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-10"
          >
            <HorizontalMarquee items={featuredTestimonials} />
          </motion.div>
        )}

        {/* ── Vertical scrolling text testimonials ──────────────────── */}
        <div className="relative mt-6 h-[min(520px,70vh)] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_2%,black_98%,transparent)] sm:mt-8 sm:h-[600px]">
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
