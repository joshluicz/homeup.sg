"use client";

import { useEffect } from "react";
import { consumePlaybookRestore } from "@/lib/playbook/return-to";

export function PlaybookScrollRestore() {
  useEffect(() => {
    const state = consumePlaybookRestore();
    if (!state || state.pathname !== "/playbook") return;

    let attempts = 0;
    const maxAttempts = 8;

    const restore = () => {
      if (state.hash) {
        const el = document.querySelector(state.hash);
        if (el) {
          el.scrollIntoView({ behavior: "auto", block: "start" });
          return;
        }
      }
      window.scrollTo({ top: state.scrollY, behavior: "auto" });
    };

    const tick = () => {
      restore();
      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(tick, 120);
      }
    };

    requestAnimationFrame(tick);
  }, []);

  return null;
}
