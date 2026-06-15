import { Home, TrendingUp, MapPin } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { ListingStats } from "@/lib/listings/queries";

type ListingsHeroProps = {
  stats: ListingStats;
};

export function ListingsHero({ stats }: ListingsHeroProps) {
  const statItems = [
    { icon: Home, value: `${stats.hdb}`, label: "HDB Listings" },
    { icon: TrendingUp, value: `${stats.condo}`, label: "Condo Listings" },
    { icon: MapPin, value: `${stats.landed}`, label: "Landed Listings" },
  ];

  return (
    <section className="relative overflow-hidden bg-neutral-50 pb-16 pt-16 sm:pb-20 sm:pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,154,68,0.08),transparent)]"
      />

      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Current Listings</Eyebrow>

          <h1 className="mt-4 font-display text-display-sm font-extrabold tracking-tight text-neutral-900 sm:text-display-md">
            Find Your Next{" "}
            <span className="text-primary-600">Singapore Home.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
            Browse {stats.total} active listing{stats.total === 1 ? "" : "s"} across HDB, condo, and landed properties
            in Singapore. Every property is represented by a CEA-licensed HomeUP advisor at a
            transparent fixed fee, not a percentage of the sale price. Enquire directly via WhatsApp
            and speak with the agent handling the listing.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4">
          {statItems.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                <Icon className="h-4 w-4 text-primary-600" />
              </div>
              <p className="font-display text-xl font-extrabold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
