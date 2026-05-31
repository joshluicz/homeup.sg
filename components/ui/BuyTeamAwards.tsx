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
    source: "HomeUP",
    title: "$200M+ Real Estate Transacted",
    highlight: "Singapore",
  },
  {
    source: "NUS",
    title: "Real Estate Graduate",
    highlight: "Distinction",
  },
];

function LaurelAwardBadge({ award }: { award: TeamAward }) {
  return (
    <LaurelFrame>
      <p className="text-sm font-bold leading-tight text-white sm:text-base">
        {award.source}
      </p>
      <p className="mt-1 max-w-[130px] text-xs font-normal leading-snug text-white/85 sm:max-w-[150px] sm:text-sm">
        {award.title}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white sm:text-sm">
        {award.highlight}
      </p>
    </LaurelFrame>
  );
}

interface BuyTeamAwardsProps {
  className?: string;
  compact?: boolean;
}

export function BuyTeamAwards({ className = "", compact = false }: BuyTeamAwardsProps) {
  return (
    <div
      className={[
        "w-full bg-[#0f1629]",
        compact ? "px-3 py-3.5 sm:px-5 sm:py-4" : "px-4 py-4 sm:px-6 sm:py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="HomeUP buying team awards and credentials"
    >
      <div className="flex flex-wrap items-center justify-center gap-y-4 sm:gap-x-0 lg:flex-nowrap">
        {BUY_TEAM_AWARDS.map((award) => (
          <LaurelAwardBadge key={`${award.source}-${award.title}`} award={award} />
        ))}
      </div>
    </div>
  );
}
