import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { AboutContent } from "@/components/sections/AboutContent";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getListingStatsServer } from "@/lib/listings/server-queries";
import { aboutPageSchema, breadcrumbSchema, organizationSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "About HomeUP | Fixed-Fee Property Agents Singapore",
  description:
    "Learn about HomeUP, Singapore's fixed-fee property advisory. CEA-licensed advisors, transparent pricing from $1,999, 1,000+ transactions closed, operated by C & H Properties Pte Ltd.",
  path: "/about",
});

export default async function AboutPage() {
  const stats = await getListingStatsServer();

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          aboutPageSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <Navbar />
      <main className="bg-white">
        <AboutContent listingCount={stats.total} />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
