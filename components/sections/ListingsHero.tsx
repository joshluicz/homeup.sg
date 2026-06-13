import { Home, TrendingUp, MapPin } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LISTINGS } from "@/lib/data/listings";

const hdbCount    = LISTINGS.filter((l) => l.type === "HDB").length;
const condoCount  = LISTINGS.filter((l) => l.type === "Condo").length;
const landedCount = LISTINGS.filter((l) => l.type === "Landed").length;

const stats = [
  { icon: Home,       value: `${hdbCount}`,    label: "HDB Listings" },
  { icon: TrendingUp, value: `${condoCount}`,   label: "Condo Listings" },
  { icon: MapPin,     value: `${landedCount}+`, label: "Landed Listings" },
];

export function ListingsHero() {
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
            Browse {LISTINGS.length} active listings across HDB, condo, and landed properties
            in Singapore. Every property is represented by a CEA-licensed HomeUP advisor at a
            transparent fixed fee — not a percentage of the sale price. Whether you are
            upgrading from an HDB flat, buying your first condo, or exploring landed homes,
            you can enquire directly via WhatsApp and speak with the agent handling the
            listing. Listings are updated regularly and link to full details on PropertyGuru.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                <Icon className="h-4 w-4 text-primary-600" />
              </div>
              <p className="font-display text-xl font-bold text-neutral-900">{value}</p>
              <p className="text-xs font-medium text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
