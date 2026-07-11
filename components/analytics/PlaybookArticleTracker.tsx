"use client";

import { useEffect, useRef } from "react";
import { trackArticleView } from "@/lib/analytics";

export function PlaybookArticleTracker({ slug, title }: { slug: string; title?: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackArticleView(slug, title);
  }, [slug, title]);

  return null;
}
