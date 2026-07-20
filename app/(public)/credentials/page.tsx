import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { CredentialsContent } from "@/components/sections/CredentialsContent";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, organizationSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Credentials & Awards | HomeUP Singapore",
  description:
    "HomeUP's licences, CEA registration numbers and industry awards, published in full. CEA licence L3007139C, operated by C & H Properties Pte Ltd.",
  path: "/credentials",
});

export default function CredentialsPage() {
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
      <main className="bg-white">
        <CredentialsContent />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
