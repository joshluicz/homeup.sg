"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  dismissLoadingScreenDom,
  LOADING_FADE_MS,
  LOADING_FALLBACK_MS,
  LOADING_MIN_MS,
  LOADING_SCREEN_ID,
} from "@/lib/loading-screen-dismiss";

export function LoadingScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      setFading(true);
      dismissLoadingScreenDom();
      setTimeout(() => setGone(true), LOADING_FADE_MS);
    }

    function onReady() {
      const remaining = Math.max(0, LOADING_MIN_MS - (Date.now() - start));
      setTimeout(dismiss, remaining);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady, { once: true });
    } else {
      onReady();
    }

    const fallback = setTimeout(dismiss, LOADING_FALLBACK_MS);

    return () => {
      document.removeEventListener("DOMContentLoaded", onReady);
      clearTimeout(fallback);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      id={LOADING_SCREEN_ID}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        opacity: fading ? 0 : 1,
        transition: `opacity ${LOADING_FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div className="loading-screen-logo">
        <Image
          src="/images/homeup-logo-wordmark.svg"
          alt="HomeUP"
          width={260}
          height={55}
          priority
          unoptimized
        />
        <div className="loading-shimmer" />
      </div>
    </div>
  );
}
