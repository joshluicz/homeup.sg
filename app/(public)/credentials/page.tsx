import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { CredentialsExperience } from "@/components/sections/credentials/CredentialsExperience";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, organizationSchema } from "@/lib/seo/schema";
import { getListingStatsServer } from "@/lib/listings/server-queries";

export const metadata = buildPageMetadata({
  title: "Why HomeUP | Credentials, Licensing & Track Record",
  description:
    "1,000+ transactions closed by CEA-licensed advisors under C & H Properties (CEA L3007139C). Fixed fees from $1,999, live listings across Singapore, and registration numbers you can verify.",
  path: "/credentials",
});

export default async function CredentialsPage() {
  // Listing count is read live rather than written into the copy — the site quotes a figure that
  // moves weekly, and a hardcoded one would be wrong within days.
  const stats = await getListingStatsServer();

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Credentials", path: "/credentials" },
          ]),
        ]}
      />
      <Navbar />
      <main>
        <CredentialsExperience listingCount={stats.total} />
      </main>
      <Footer />
    </>
  );
}
