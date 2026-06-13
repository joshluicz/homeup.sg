import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { ListingsHero } from "@/components/sections/ListingsHero";
import { ListingsGrid } from "@/components/sections/ListingsGrid";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { LastUpdated } from "@/components/ui/LastUpdated";
import { LISTINGS } from "@/lib/data/listings";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, listingsItemListSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Property Listings Singapore",
  description:
    "Browse HomeUP's active HDB, Condo, and Landed property listings across Singapore. Every listing is handled by a CEA-licensed agent at a transparent fixed fee. HDB from $1,999, Condo from $4,999.",
  path: "/listings",
});

export default function ListingsPage() {
  const listings = LISTINGS;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Listings", path: "/listings" },
          ]),
          listingsItemListSchema(listings),
        ]}
      />
      <Navbar />
      <main className="bg-white">
        <ListingsHero />
        <ListingsGrid listings={listings} />
        <CtaBanner />
        <LastUpdated className="pb-8" />
      </main>
      <Footer />
    </>
  );
}
