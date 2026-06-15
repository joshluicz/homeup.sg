import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { ListingsPageClient } from "@/components/listings/ListingsPageClient";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { LastUpdated } from "@/components/ui/LastUpdated";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Property Listings Singapore",
  description:
    "Browse HomeUP's active HDB, Condo, and Landed property listings across Singapore. Every listing is handled by a CEA-licensed agent at a transparent fixed fee. HDB from $1,999, Condo from $4,999.",
  path: "/listings",
});

export default function ListingsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Listings", path: "/listings" },
          ]),
        ]}
      />
      <Navbar />
      <main className="bg-white">
        <ListingsPageClient />
        <CtaBanner />
        <LastUpdated className="pb-8" />
      </main>
      <Footer />
    </>
  );
}
