import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { AboutContent } from "@/components/sections/AboutContent";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { aboutPageSchema, breadcrumbSchema, organizationSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "About HomeUP — Fixed-Fee Property Agents Singapore",
  description:
    "Learn about HomeUP — Singapore's fixed-fee property agency. CEA-licensed advisors, transparent pricing from $1,999, 1,000+ transactions closed, operated by C & H Properties Pte Ltd.",
  path: "/about",
});

export default function AboutPage() {
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
        <AboutContent />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
