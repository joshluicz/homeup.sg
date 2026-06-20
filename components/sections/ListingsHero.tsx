import { Eyebrow } from "@/components/ui/Eyebrow";

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
            Browse all our active listings across HDB, condo, and landed properties in Singapore.
          </p>
        </div>
      </div>
    </section>
  );
}
