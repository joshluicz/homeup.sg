import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ListingDetailContent } from "@/components/listings/ListingDetailContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { CtaBanner } from "@/components/sections/CtaBanner";
import {
  getAllListingSlugsServer,
  getListingBySlugServer,
  getRelatedListingsServer,
} from "@/lib/listings/server-queries";
import { formatListingPrice } from "@/lib/listings/public-utils";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, realEstateListingSchema } from "@/lib/seo/schema";

type ListingDetailPageProps = {
  params: { slug: string };
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllListingSlugsServer();
  return [...new Set(slugs)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const listing = await getListingBySlugServer(params.slug);
  if (!listing) notFound();

  return buildPageMetadata({
    title: listing.title,
    description: `${formatListingPrice(listing)}. ${listing.address_line_1 ?? "Singapore property listing"}. Enquire with a HomeUP CEA-licensed advisor.`,
    path: `/listings/${listing.slug}`,
    ogImage: listing.featured_image_url ?? undefined,
    ogImageAlt: listing.title,
  });
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const listing = await getListingBySlugServer(params.slug);
  if (!listing) notFound();

  const related = await getRelatedListingsServer(listing.flat_type, listing.slug);

  return (
    <>
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
      <Navbar />
      <main>
        <ListingDetailContent listing={listing} related={related} />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
