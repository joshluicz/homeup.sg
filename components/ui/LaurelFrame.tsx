"use client";

import { useId, type ReactNode } from "react";

const WREATH_W = 1024;
const WREATH_H = 777;
const HALF_W = WREATH_W / 2;
const HALF_ASPECT = `${HALF_W} / ${WREATH_H}`;

function LaurelSide({ flip, uid, fluid }: { flip?: boolean; uid: string; fluid?: boolean }) {
  const suffix = flip ? "r" : "l";
  const invId = `${uid}-inv-${suffix}`;
  const goldId = `${uid}-gold-${suffix}`;
  const maskId = `${uid}-mask-${suffix}`;

  return (
    <svg
      viewBox={`0 0 ${HALF_W} ${WREATH_H}`}
      className={
        fluid
          ? "h-[clamp(2rem,7vw,3.5rem)] w-auto shrink-0 -mx-1 sm:-mx-1.5"
          : "h-[2.35rem] w-auto shrink-0 sm:h-[3rem] lg:h-[3.5rem] -mx-1 sm:-mx-1.5"
      }
      style={{ aspectRatio: HALF_ASPECT }}
      aria-hidden="true"
    >
      <defs>
        <filter id={invId} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"
          />
        </filter>
        <linearGradient id={goldId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C547" />
          <stop offset="55%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#A8861E" />
        </linearGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={HALF_W} height={WREATH_H}>
          <image
            href="/images/laurel-flat.png"
            width={WREATH_W}
            height={WREATH_H}
            x={flip ? -HALF_W : 0}
            filter={`url(#${invId})`}
            preserveAspectRatio="none"
          />
        </mask>
      </defs>
      <rect width={HALF_W} height={WREATH_H} fill={`url(#${goldId})`} mask={`url(#${maskId})`} />
    </svg>
  );
}

export function LaurelFrame({
  children,
  fluid,
}: {
  children: ReactNode;
  fluid?: boolean;
}) {
  const uid = useId().replace(/:/g, "");

  return (
    <div className="mx-auto flex w-fit max-w-full min-w-0 items-center justify-center">
      <LaurelSide uid={uid} fluid={fluid} />
      <div className="flex w-[clamp(3.75rem,20vw,7.25rem)] shrink-0 flex-col items-center px-0.5 text-center sm:px-1">
        {children}
      </div>
      <LaurelSide uid={uid} flip fluid={fluid} />
    </div>
  );
}
