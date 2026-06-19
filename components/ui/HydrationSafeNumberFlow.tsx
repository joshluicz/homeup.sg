"use client";

import { useEffect, useState, type ComponentProps } from "react";
import NumberFlow from "@number-flow/react";

type HydrationSafeNumberFlowProps = ComponentProps<typeof NumberFlow>;

/** Renders plain text on SSR/first paint to avoid NumberFlow hydration mismatches. */
export function HydrationSafeNumberFlow({ value, format, ...props }: HydrationSafeNumberFlowProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    const numeric = typeof value === "number" ? value : 0;
    if (format?.style === "decimal") {
      return <>{numeric.toLocaleString("en-SG")}</>;
    }
    return <>{numeric}</>;
  }

  return <NumberFlow value={value} format={format} {...props} />;
}
