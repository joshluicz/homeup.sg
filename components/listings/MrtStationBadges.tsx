import { cn } from "@/lib/utils";
import {
  lineStyleForCode,
  parseMrtCode,
} from "@/lib/data/mrt-line-styles";
import type { MrtStopGroup } from "@/lib/listings/mrt-proximity";

type MrtCodePillProps = {
  code: string;
  className?: string;
};

export function MrtCodePill({ code, className }: MrtCodePillProps) {
  const parsed = parseMrtCode(code);
  const style = lineStyleForCode(code);

  const label = parsed.number ? `${parsed.line} ${parsed.number}` : parsed.line;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[2.75rem] items-center justify-center rounded-full px-2 py-0.5 text-center text-[10px] font-extrabold leading-none tracking-wide text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)]",
        className,
      )}
      style={{ backgroundColor: style.bg, border: `1.5px solid ${style.border}` }}
      aria-label={label}
    >
      {label}
    </span>
  );
}

type MrtStationBadgesProps = {
  stop: MrtStopGroup;
  size?: "sm" | "md";
};

export function MrtStationBadges({ stop, size = "md" }: MrtStationBadgesProps) {
  const codes = stop.stations.map((station) => station.code);
  const gapClass = stop.transferType === "tap_out" ? "gap-1" : "-space-x-1";

  if (codes.length === 1) {
    return <MrtCodePill code={codes[0]} className={size === "sm" ? "scale-90" : undefined} />;
  }

  return (
    <span className={cn("inline-flex items-center", gapClass)} aria-label={`${stop.name} interchange`}>
      {codes.map((code) => (
        <MrtCodePill key={code} code={code} className={size === "sm" ? "scale-90" : undefined} />
      ))}
    </span>
  );
}
