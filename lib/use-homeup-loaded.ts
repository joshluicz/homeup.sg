"use client";

import { useEffect, useState } from "react";

/** True once the splash has dismissed (or was skipped). */
export function useHomeupLoaded(): boolean {
  const [loaded, setLoaded] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!(window as unknown as Record<string, unknown>).__homeupLoaded;
  });

  useEffect(() => {
    if (loaded) return;
    const onLoaded = () => setLoaded(true);
    window.addEventListener("homeup:loaded", onLoaded, { once: true });
    return () => window.removeEventListener("homeup:loaded", onLoaded);
  }, [loaded]);

  return loaded;
}
