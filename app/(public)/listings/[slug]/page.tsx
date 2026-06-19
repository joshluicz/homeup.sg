import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ListingDetailClient } from "@/components/listings/ListingDetailClient";
import { ListingDetailContent } from "@/components/listings/ListingDetailContent";
import { ListingDetailNotFound } from "@/components/listings/ListingDetailNotFound";
import { JsonLd } from "@/components/seo/JsonLd";
import { CtaBanner } from "@/components/sections/CtaBanner";
import {
  getAllListingSlugsServer,
  getListingBySlugServer,
  getRelatedListingsServer,
} from "@/lib/listings/server-queries";
import { LISTING_DETAIL_FALLBACK_SLUG } from "@/lib/listings/slug-from-path";
import { formatListingPrice } from "@/lib/listings/public-utils";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, realEstateListingSchema } from "@/lib/seo/schema";

type ListingDetailPageProps = {
  params: { slug: string };
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllListingSlugsServer();
  const unique = new Set(slugs);
  unique.add(LISTING_DETAIL_FALLBACK_SLUG);
  return [...unique].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  if (params.slug === LISTING_DETAIL_FALLBACK_SLUG) {
    return { title: "Property Listing" };
  }

  const listing = await getListingBySlugServer(params.slug);
  if (!listing) return { title: "Listing Not Found" };

  return buildPageMetadata({
    title: listing.title,
    description: `${formatListingPrice(listing)}. ${listing.address_line_1 ?? "Singapore property listing"}. Enquire with a HomeUP CEA-licensed advisor.`,
    path: `/listings/${listing.slug}`,
    ogImage: listing.featured_image_url ?? undefined,
    ogImageAlt: listing.title,
  });
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  if (params.slug === LISTING_DETAIL_FALLBACK_SLUG) {
    return (
      <>
        <Navbar />
        <main>
          <ListingDetailClient slug={params.slug} />
          <CtaBanner />
        </main>
        <Footer />
      </>
    );
  }

  const listing = await getListingBySlugServer(params.slug);
  const related = listing
    ? await getRelatedListingsServer(listing.flat_type, listing.slug)
    : [];

  return (
    <>
      {listing && (
        <JsonLd
          data={[
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Listings", path: "/listings" },
              { name: listing.title, path: `/listings/${listing.slug}` },
            ]),
            realEstateListingSchema(listing),
          ]}
        />
      )}
      <Navbar />
      <main>
        {listing ? (
          <ListingDetailContent listing={listing} related={related} />
        ) : (
          <ListingDetailNotFound />
        )}
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
