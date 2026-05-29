"use client";

import {
  motion,
  useInView,
  type TargetAndTransition,
  type Variants,
} from "framer-motion";
import type { ElementType, ReactNode, RefObject } from "react";
import { useMemo, useRef } from "react";

type CustomVariants = {
  visible: (i: number) => TargetAndTransition;
  hidden: TargetAndTransition;
};

interface TimelineContentProps {
  children: ReactNode;
  animationNum?: number;
  timelineRef?: RefObject<HTMLDivElement | null>;
  customVariants?: CustomVariants;
  className?: string;
  as?: ElementType;
}

const defaultVariants: CustomVariants = {
  hidden: { opacity: 0, y: -20, filter: "blur(10px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

export function TimelineContent({
  children,
  animationNum = 0,
  customVariants,
  className,
  as: Tag = "div",
}: TimelineContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.05 });
  const variants = (customVariants ?? defaultVariants) as Variants;

  const MotionTag = useMemo(() => {
    const map: Record<string, ReturnType<typeof motion.create>> = {
      p: motion.p,
      span: motion.span,
      section: motion.section,
      article: motion.article,
      h1: motion.h1,
      h2: motion.h2,
      h3: motion.h3,
      ul: motion.ul,
      li: motion.li,
    };
    return (map[Tag as string] ?? motion.div) as typeof motion.div;
  }, [Tag]);

  return (
    <MotionTag
      ref={ref}
      custom={animationNum}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
