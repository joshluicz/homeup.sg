import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaybookHero } from "@/components/sections/PlaybookHero";
import { PlaybookLibrary } from "@/components/sections/PlaybookLibrary";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { PLAYBOOK_VIDEOS } from "@/lib/data/playbook";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Property Playbook — Video Guides",
  description:
    "The HomeUP Playbook: a curated library of video guides covering every stage of buying and selling property in Singapore. From HDB processes to condo upgrades, learn at your own pace.",
  path: "/playbook",
});

export default function PlaybookPage() {
  const videos = PLAYBOOK_VIDEOS;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Playbook", path: "/playbook" },
        ])}
      />
      <Navbar />
      <main className="bg-white">
        <PlaybookHero />
        <PlaybookLibrary videos={videos} />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
