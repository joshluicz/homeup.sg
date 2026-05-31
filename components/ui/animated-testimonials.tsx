"use client";

import { Separator } from "@/components/ui/separator";
import { Quote, Star } from "lucide-react";
import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
          {/* ── Left: heading + dot nav ── */}
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

              {/* Dot navigation */}
              <div className="flex items-center gap-3 pt-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
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

          {/* ── Right: testimonial cards (grid stack = uniform height from tallest review) ── */}
          <motion.div variants={itemVariants} className="relative">
            <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  className="col-start-1 row-start-1"
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
                    {/* Stars */}
                    <div className="mb-4 flex shrink-0 gap-1 sm:mb-5">
                      {Array(testimonial.rating)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ))}
                    </div>

                    {/* Quote */}
                    <div className="relative mb-4 min-h-0 flex-1 sm:mb-6">
                      <Quote className="absolute -left-1 -top-2 h-7 w-7 rotate-180 text-primary-100 sm:-left-2 sm:h-8 sm:w-8" />
                      <p className="relative z-10 text-sm leading-relaxed text-neutral-700 sm:text-base">
                        &ldquo;{testimonial.content}&rdquo;
                      </p>
                    </div>

                    <Separator className="my-3 shrink-0 sm:my-4" />

                    {/* Author */}
                    <div className="shrink-0">
                      <p className="font-semibold text-neutral-900">{testimonial.name}</p>
                      <p className="text-sm text-neutral-500">
                        {testimonial.role} · {testimonial.company}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Decorative corners */}
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-2xl bg-primary-50" />
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-2xl bg-primary-50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
