"use client";

import React from "react";
import { Star } from "lucide-react";
import { motion } from "motion/react";
import type { TestimonialColumnItem } from "@/lib/data/testimonials";
import { cn } from "@/lib/utils";

const AVATAR_COLOURS = [
  "bg-primary-100 text-primary-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-yellow-100 text-yellow-700",
  "bg-slate-100 text-slate-700",
  "bg-lime-100 text-lime-800",
  "bg-red-100 text-red-700",
];

const SOURCE_STYLES: Record<string, string> = {
  Google:   "text-blue-600",
  Facebook: "text-blue-500",
};

function InitialsAvatar({ name, avatarIndex }: { name: string; avatarIndex: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colour = AVATAR_COLOURS[avatarIndex % AVATAR_COLOURS.length];

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-10 sm:w-10 sm:text-sm",
        colour,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
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
                key={`${loop}-${item.name}`}
                className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm sm:rounded-2xl"
              >
                {/* Photo banner — shown only when a photo is available */}
                {item.photo && (
                  <div className="relative h-36 w-full sm:h-44">
                    <img
                      src={item.photo}
                      alt={`${item.name} with HomeUP agent`}
                      className="h-full w-full object-cover object-top"
                    />
                    {/* subtle gradient to blend into card body */}
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
                  </div>
                )}

                <div className={cn("p-3 sm:p-5", item.photo && "pt-2 sm:pt-3")}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <InitialsAvatar name={item.name} avatarIndex={item.avatarIndex} />
                    {item.source && (
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-medium sm:text-xs",
                          SOURCE_STYLES[item.source] ?? "text-neutral-400",
                        )}
                      >
                        via {item.source}
                      </span>
                    )}
                  </div>
                  <StarRating />
                  <p className="text-xs font-normal leading-relaxed text-neutral-600 sm:text-sm">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
              </article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
