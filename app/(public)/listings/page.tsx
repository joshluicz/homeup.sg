import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { ListingsPageClient } from "@/components/listings/ListingsPageClient";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { ListingsHero } from "@/components/sections/ListingsHero";
import { LastUpdated } from "@/components/ui/LastUpdated";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, listingsItemListSchema } from "@/lib/seo/schema";
import { getActiveListingsServer, getListingStatsServer } from "@/lib/listings/server-queries";

export const metadata = buildPageMetadata({
  title: "Property Listings Singapore",
  description:
    "Browse HomeUP's active HDB, Condo, and Landed property listings across Singapore. Every listing is handled by a CEA-licensed agent at a transparent fixed fee. HDB from $1,999, Condo from $4,999.",
  path: "/listings",
});

export const revalidate = 3600;

export default async function ListingsPage() {
  const [listings, stats] = await Promise.all([
    getActiveListingsServer().catch(() => []),
    getListingStatsServer().catch(() => ({
      total: 0,
      hdb: 0,
      condo: 0,
      landed: 0,
      apartment: 0,
    })),
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
        <ListingsHero stats={stats} />
        <ListingsPageClient initialListings={listings} initialStats={stats} />
        <CtaBanner />
        <LastUpdated className="pb-8" />
      </main>
      <Footer />
    </>
  );
}
