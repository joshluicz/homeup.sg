import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { AboutContent } from "@/components/sections/AboutContent";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { SITE_VISION } from "@/lib/seo/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { aboutPageSchema, breadcrumbSchema, organizationSchema } from "@/lib/seo/schema";
import { getListingStatsServer } from "@/lib/listings/server-queries";

export const metadata = buildPageMetadata({
  title: "About HomeUP | Fixed-Fee Property Agents Singapore",
  description: `${SITE_VISION} Learn about HomeUP, Singapore's fixed-fee property advisory. CEA-licensed advisors, transparent pricing from $1,999, 1,000+ transactions closed, operated by C & H Properties Pte Ltd.`,
  path: "/about",
});

/** Safety net: listing counts also bust via revalidateTag("listings") after sync. */
export const revalidate = 300;

export default async function AboutPage() {
  const stats = await getListingStatsServer();
  const asOfDate = new Date().toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
        <AboutContent listingCount={stats.total} listingsAsOfDate={asOfDate} />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
