"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const MIN_MS = 1500;
const FADE_MS = 600;
const FALLBACK_MS = 6000;

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
      (window as unknown as Record<string, unknown>).__homeupLoaded = true;
      window.dispatchEvent(new CustomEvent("homeup:loaded"));
      setTimeout(() => setGone(true), FADE_MS);
    }

    function onLoad() {
      const remaining = Math.max(0, MIN_MS - (Date.now() - start));
      setTimeout(dismiss, remaining);
    }

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    const fallback = setTimeout(dismiss, FALLBACK_MS);

    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(fallback);
    };
  }, []);

  if (gone) return null;

  return (
    <div
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
        transition: `opacity ${FADE_MS}ms ease`,
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
