import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaybookScrollRestore } from "@/components/playbook/PlaybookScrollRestore";
import { PlaybookHero } from "@/components/sections/PlaybookHero";
import { PlaybookJourney } from "@/components/sections/PlaybookJourney";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Property Playbook | Guides & Videos",
  description:
    "The HomeUP Playbook: short-form property videos and in-depth articles covering every stage of buying and selling in Singapore.",
  path: "/playbook",
});

export default function PlaybookPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Playbook", path: "/playbook" },
        ])}
      />
      <Navbar />
      <PlaybookScrollRestore />
      <main className="bg-white">
        <PlaybookHero />
        <Suspense fallback={null}>
          <PlaybookJourney />
        </Suspense>
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
