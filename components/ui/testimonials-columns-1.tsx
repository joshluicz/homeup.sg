"use client";

import React from "react";
import {
  Cherry,
  Cloud,
  Coffee,
  Flower2,
  Gem,
  Heart,
  Home,
  Leaf,
  Sparkles,
  Star,
  Sun,
  TreeDeciduous,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import type { TestimonialColumnItem } from "@/lib/data/testimonials";
import { cn } from "@/lib/utils";

const REVIEWER_ICON_BADGES: { Icon: LucideIcon; className: string }[] = [
  { Icon: Flower2, className: "bg-primary-100 text-primary-600" },
  { Icon: Leaf, className: "bg-emerald-100 text-emerald-700" },
  { Icon: Sparkles, className: "bg-violet-100 text-violet-600" },
  { Icon: Star, className: "bg-amber-100 text-amber-700" },
  { Icon: Home, className: "bg-blue-100 text-blue-600" },
  { Icon: Heart, className: "bg-rose-100 text-rose-600" },
  { Icon: Gem, className: "bg-cyan-100 text-cyan-700" },
  { Icon: Coffee, className: "bg-orange-100 text-orange-700" },
  { Icon: Sun, className: "bg-yellow-100 text-yellow-700" },
  { Icon: Cloud, className: "bg-slate-100 text-slate-600" },
  { Icon: TreeDeciduous, className: "bg-lime-100 text-lime-800" },
  { Icon: Cherry, className: "bg-red-100 text-red-600" },
];

function ReviewerBadge({ avatarIndex }: { avatarIndex: number }) {
  const badge = REVIEWER_ICON_BADGES[avatarIndex % REVIEWER_ICON_BADGES.length];
  const Icon = badge.Icon;

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
        badge.className,
      )}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </span>
  );
}

export function TestimonialsColumn({
  className,
  testimonials,
  duration = 10,
}: {
  className?: string;
  testimonials: TestimonialColumnItem[];
  duration?: number;
}) {
  if (testimonials.length === 0) return null;

  return (
    <div className={cn("min-w-0 flex-1 overflow-hidden", className)}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-3 pb-3 sm:gap-6 sm:pb-6"
      >
        {[0, 1].map((loop) => (
          <React.Fragment key={loop}>
            {testimonials.map((item) => (
              <article
                key={`${loop}-${item.name}-${item.role}`}
                className="w-full rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-6"
              >
                <p className="text-xs font-normal leading-relaxed text-neutral-600 sm:text-sm">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-2 sm:mt-5 sm:gap-3">
                  <ReviewerBadge avatarIndex={item.avatarIndex} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold leading-tight text-neutral-900 sm:text-sm">
                      {item.name}
                    </p>
                    <p className="truncate text-[11px] leading-tight text-neutral-500 sm:text-sm">
                      {item.role}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
