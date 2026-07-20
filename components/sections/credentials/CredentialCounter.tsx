"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * Count-up figure that animates once, when it enters the viewport.
 *
 * Built on framer-motion (already a dependency, and what components/ui/motion-primitives uses)
 * rather than installing a 21st.dev counter — a registry component here would add a dependency
 * and a second animation idiom for roughly fifteen lines of spring maths.
 *
 * Respects prefers-reduced-motion by rendering the final value immediately.
 */
export function CredentialCounter({
  value,
  suffix = "",
  prefix = "",
  className,
  duration = 1.6,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("en-SG")}
      {suffix}
    </span>
  );
}
