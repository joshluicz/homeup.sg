import { Eyebrow } from "@/components/ui/Eyebrow";
import type { ListingStats } from "@/lib/listings/queries";

const STAT_CHIPS = [
  { key: "hdb", label: "HDB" },
  { key: "condo", label: "Condo" },
  { key: "landed", label: "Landed" },
] as const;

export function ListingsHero({ stats }: { stats: ListingStats }) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-100 bg-neutral-50 py-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,154,68,0.08),transparent)]"
      />

      <div className="container-page relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Current Listings</Eyebrow>

            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
              Find Your Next{" "}
              <span className="text-primary-600">Singapore Home</span>
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              {stats.total > 0 ? (
                <>
                  <span className="font-semibold text-primary-600">
                    {stats.total.toLocaleString()} active listings
                  </span>{" "}
                  across HDB, condo, and landed properties.
                </>
              ) : (
                "Browse HDB, condo, and landed properties across Singapore."
              )}
            </p>
          </div>

          {stats.total > 0 && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {STAT_CHIPS.map(({ key, label }) => {
                const count = stats[key];
                if (!count) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm shadow-sm"
                  >
                    <span className="font-semibold text-neutral-900">{count}</span>
                    <span className="text-neutral-500">{label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
