import { LaurelFrame } from "@/components/ui/LaurelFrame";

/** Laurel wreath + award copy — dark navy strip, gold wreaths, white type. */

export interface TeamAward {
  source: string;
  title: string;
  highlight: string;
}

export const BUY_TEAM_AWARDS: TeamAward[] = [
  {
    source: "C & H",
    title: "Top 3 Producer in Agency · 2025",
    highlight: "Singapore",
  },
  {
    source: "C & H",
    title: "Top Private Buying Transactor · 2025",
    highlight: "Agency Best",
  },
  {
    source: "HOMEUP",
    title: "$200M+ Real Estate Transacted",
    highlight: "Singapore",
  },
];

function LaurelAwardBadge({ award, fluid }: { award: TeamAward; fluid?: boolean }) {
  return (
    <LaurelFrame fluid={fluid}>
      <p className="whitespace-nowrap font-bold leading-none text-white text-[clamp(0.625rem,2.6vw,1rem)]">
        {award.source}
      </p>
      <p className="mt-0.5 font-normal leading-tight text-white/85 text-[clamp(0.5625rem,2.1vw,0.875rem)] sm:mt-1">
        {award.title}
      </p>
      <p className="mt-0.5 whitespace-nowrap font-bold uppercase tracking-wide text-white text-[clamp(0.5625rem,2.1vw,0.875rem)] sm:mt-1">
        {award.highlight}
      </p>
    </LaurelFrame>
  );
}

interface BuyTeamAwardsProps {
  className?: string;
  compact?: boolean;
  /** Full-width strip — scales with viewport (buy page) */
  strip?: boolean;
}

export function BuyTeamAwards({
  className = "",
  compact = false,
  strip = false,
}: BuyTeamAwardsProps) {
  if (strip) {
    return (
      <div
        className={["w-full bg-[#0f1629] py-[clamp(0.75rem,2.5vw,1.25rem)]", className]
          .filter(Boolean)
          .join(" ")}
        aria-label="HOMEUP buying team awards and credentials"
      >
        <div className="grid w-full grid-cols-1 items-center gap-x-[clamp(0.25rem,1.5vw,1rem)] gap-y-[clamp(0.75rem,3vw,1.25rem)] px-[clamp(0.375rem,2vw,1.5rem)] sm:grid-cols-3">
          {BUY_TEAM_AWARDS.map((award) => (
            <LaurelAwardBadge key={`${award.source}-${award.title}`} award={award} fluid />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "w-full bg-[#0f1629]",
        compact ? "px-3 py-3.5 sm:px-5 sm:py-4" : "px-4 py-4 sm:px-6 sm:py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="HOMEUP buying team awards and credentials"
    >
      <div className="grid grid-cols-2 gap-x-2 gap-y-5 sm:gap-x-4 lg:flex lg:flex-nowrap lg:items-center lg:justify-center lg:gap-y-4">
        {BUY_TEAM_AWARDS.map((award) => (
          <LaurelAwardBadge key={`${award.source}-${award.title}`} award={award} />
        ))}
      </div>
    </div>
  );
}
