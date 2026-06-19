"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function AnalyticsProvider() {
  const pathname = usePathname();
  const fired = useRef<Set<number>>(new Set());

  // Only admins ever sign in, so a Supabase session means this is internal
  // traffic. Flag the browser and disable GA4 for the rest of the session so
  // admin activity never pollutes Analytics. The flag persists across IP changes.
  useEffect(() => {
    if (!GA_ID) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        try {
          localStorage.setItem("homeup-internal", "1");
        } catch { /* storage unavailable */ }
        (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true;
      }
    });
  }, []);

  useEffect(() => {
    fired.current = new Set();
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = Math.round((scrolled / total) * 100);
      for (const threshold of [25, 50, 75, 100]) {
        if (pct >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold);
          trackEvent(`scroll_${threshold}`, { page_path: pathname });
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return null;
}
