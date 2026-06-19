import { ListingCardStatic } from "@/components/listings/ListingCardStatic";
import type { Listing } from "@/lib/listings/types";
import { formatListingPrice } from "@/lib/listings/public-utils";
import { getPublicListingPath } from "@/lib/listings/utils";

type ListingsGridStaticProps = {
  listings: Listing[];
};

/** Server-rendered listing grid for crawlers and first paint. */
export function ListingsGridStatic({ listings }: ListingsGridStaticProps) {
  if (listings.length === 0) {
    return (
      <section className="section-padding bg-white">
        <div className="container-page py-20 text-center">
          <p className="text-sm font-semibold text-neutral-600">No listings yet</p>
          <p className="mt-2 text-sm text-neutral-400">Check back soon for new properties.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-page">
        <div className="mb-8 sm:mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            All properties
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
            <span className="tabular-nums text-primary-600">{listings.length.toLocaleString()}</span>{" "}
            active listing{listings.length === 1 ? "" : "s"}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCardStatic key={listing.id} listing={listing} />
          ))}
        </div>

        <noscript>
          <ul className="mt-8 space-y-2 border-t border-neutral-100 pt-8">
            {listings.map((listing) => (
              <li key={`text-${listing.id}`}>
                <a href={getPublicListingPath(listing.slug)} className="text-sm text-neutral-700">
                  {listing.title}
                  {listing.address_line_1 ? `, ${listing.address_line_1}` : ""}
                  {" · "}
                  {formatListingPrice(listing)}
                </a>
              </li>
            ))}
          </ul>
        </noscript>
      </div>
    </section>
  );
}
