"use client";
import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

interface AnimProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/** Fades up on scroll into view. SSR-visible — does not depend on JS to show content. */
export function FadeInUp({ children, delay = 0, className }: AnimProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Fades in on scroll (no vertical movement). SSR-visible. */
export function FadeIn({ children, delay = 0, className }: AnimProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? { opacity: 1 } : false}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a grid/list and staggers its direct StaggerItem children. */
export function StaggerContainer({ children, className }: AnimProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.05 });

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? "visible" : false}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Must be a direct child of StaggerContainer to participate in stagger. */
export function StaggerItem({ children, className }: AnimProps) {
  return (
    <motion.div
      initial={false}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
