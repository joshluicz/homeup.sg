import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { ListingsPageClient } from "@/components/listings/ListingsPageClient";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, listingsItemListSchema } from "@/lib/seo/schema";
import { getActiveListingsServer, getListingStatsServer } from "@/lib/listings/server-queries";

export const metadata = buildPageMetadata({
  title: "Property Listings Singapore",
  description:
    "Browse HomeUP's active HDB, Condo, and Landed property listings across Singapore. Every listing is handled by a CEA-licensed agent at a transparent fixed fee. HDB from $1,999, Condo from $4,999.",
  path: "/listings",
});

/** Safety net: listing data also busts via revalidateTag("listings") after sync. */
export const revalidate = 300;

export default async function ListingsPage() {
  const [listings, stats] = await Promise.all([
    getActiveListingsServer(),
    getListingStatsServer(),
  ]);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Listings", path: "/listings" },
          ]),
          ...(listings.length > 0 ? [listingsItemListSchema(listings)] : []),
        ]}
      />
      <Navbar />
      <main className="bg-white">
        <ListingsPageClient initialListings={listings} initialStats={stats} />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
