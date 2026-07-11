import { ListingCardStatic } from "@/components/listings/ListingCardStatic";
import { DEFAULT_LISTINGS_PER_PAGE } from "@/components/listings/ListingsPaginationBar";
import { SectionBlendTop } from "@/components/ui/SectionBlend";
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
      <section className="bg-white px-[var(--gutter)] py-12">
        <div className="container-page py-20 text-center">
          <p className="text-sm font-semibold text-neutral-600">No listings yet</p>
          <p className="mt-2 text-sm text-neutral-400">Check back soon for new properties.</p>
        </div>
      </section>
    );
  }

  const visibleListings = listings.slice(0, DEFAULT_LISTINGS_PER_PAGE);
  const rangeEnd = Math.min(DEFAULT_LISTINGS_PER_PAGE, listings.length);

  return (
    <section className="relative overflow-hidden bg-white px-[var(--gutter)] pb-12 pt-6 sm:pt-8">
      <SectionBlendTop from="neutral-50" />
      <div className="container-page">
        <p className="mb-6 border-b border-neutral-100 pb-5 text-sm text-neutral-500">
          Showing{" "}
          <span className="font-semibold text-neutral-700">1–{rangeEnd.toLocaleString()}</span> of{" "}
          <span className="font-semibold text-neutral-700">{listings.length.toLocaleString()}</span>
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleListings.map((listing, index) => (
            <ListingCardStatic key={listing.id} listing={listing} priority={index < 4} />
          ))}
        </div>

        <noscript>
          <ul className="mt-8 space-y-2 border-t border-neutral-100 pt-8">
            {visibleListings.map((listing) => (
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
