"use client";

import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Flower2,
  Quote,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { motion, useAnimation, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
}

export interface AnimatedTestimonialsProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  testimonials?: Testimonial[];
  autoRotateInterval?: number;
  className?: string;
}

const SWIPE_THRESHOLD = 60;

const REVIEWER_AVATARS = [
  { Icon: Flower2, className: "bg-primary-100 text-primary-600" },
  { Icon: UserRound, className: "bg-blue-100 text-blue-600" },
  { Icon: CircleUser, className: "bg-amber-100 text-amber-700" },
  { Icon: Sparkles, className: "bg-violet-100 text-violet-600" },
] as const;

export function AnimatedTestimonials({
  title = "Loved by the community",
  subtitle = "Don't just take our word for it.",
  badgeText = "Verified clients",
  testimonials = [],
  autoRotateInterval = 6000,
  className,
}: AnimatedTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const controls = useAnimation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  } as const;

  const goTo = useCallback(
    (index: number) => {
      if (testimonials.length === 0) return;
      const next = (index + testimonials.length) % testimonials.length;
      setActiveIndex(next);
    },
    [testimonials.length],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView, controls]);

  useEffect(() => {
    if (autoRotateInterval <= 0 || testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((c) => (c + 1) % testimonials.length);
    }, autoRotateInterval);
    return () => clearInterval(interval);
  }, [autoRotateInterval, testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className={`overflow-hidden bg-neutral-50 py-24 ${className ?? ""}`}
    >
      <div className="container-page">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24"
        >
          {/* Left: heading + nav */}
          <motion.div variants={itemVariants} className="flex flex-col justify-center">
            <div className="space-y-6">
              {badgeText && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                  <Star className="h-3.5 w-3.5 fill-primary-600 text-primary-600" />
                  {badgeText}
                </div>
              )}

              <h2 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
                {title}
              </h2>

              <p className="max-w-lg text-lg leading-relaxed text-neutral-500">{subtitle}</p>

              <div className="hidden items-center gap-3 pt-4 lg:flex">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`View testimonial ${index + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      activeIndex === index
                        ? "w-10 bg-primary-600"
                        : "w-2.5 bg-neutral-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: swipeable cards */}
          <motion.div variants={itemVariants} className="relative">
            <motion.div
              className="touch-pan-y cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD) goNext();
                else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
              }}
            >
              <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
                {testimonials.map((testimonial, index) => {
                  const avatar = REVIEWER_AVATARS[index % REVIEWER_AVATARS.length];
                  const AvatarIcon = avatar.Icon;

                  return (
                  <motion.div
                    key={testimonial.id}
                    className="col-start-1 row-start-1 select-none"
                    initial={false}
                    animate={{
                      opacity: activeIndex === index ? 1 : 0,
                      x: activeIndex === index ? 0 : 40,
                      scale: activeIndex === index ? 1 : 0.98,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{
                      visibility: activeIndex === index ? "visible" : "hidden",
                      zIndex: activeIndex === index ? 10 : 0,
                    }}
                  >
                    <div className="flex min-h-[420px] flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:min-h-[400px] sm:p-8">
                      <div className="mb-4 flex shrink-0 gap-1 sm:mb-5">
                        {Array(testimonial.rating)
                          .fill(0)
                          .map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                          ))}
                      </div>

                      <div className="relative mb-4 min-h-0 flex-1 sm:mb-6">
                        <Quote className="absolute -left-1 -top-2 h-7 w-7 rotate-180 text-primary-100 sm:-left-2 sm:h-8 sm:w-8" />
                        <p className="relative z-10 text-sm leading-relaxed text-neutral-700 sm:text-base">
                          &ldquo;{testimonial.content}&rdquo;
                        </p>
                      </div>

                      <Separator className="my-3 shrink-0 sm:my-4" />

                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${avatar.className}`}
                        >
                          <AvatarIcon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-semibold text-neutral-900">{testimonial.name}</p>
                          <p className="text-sm text-neutral-500">
                            {testimonial.role} · {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Swipe + arrow controls */}
            <div className="mt-5 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous review"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex flex-1 flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`View testimonial ${index + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeIndex === index
                          ? "w-8 bg-primary-600"
                          : "w-2 bg-neutral-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-400 lg:hidden">Swipe or tap arrows to browse</p>
              </div>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next review"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-2xl bg-primary-50" />
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-2xl bg-primary-50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
