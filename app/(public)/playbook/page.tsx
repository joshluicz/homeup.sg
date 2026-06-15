import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaybookHero } from "@/components/sections/PlaybookHero";
import { PlaybookLibrary } from "@/components/sections/PlaybookLibrary";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { getPlaybookVideos } from "@/lib/playbook/queries";
import { PLAYBOOK_VIDEOS } from "@/lib/data/playbook";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, videoObjectsSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Property Playbook | Video Guides",
  description:
    "The HomeUP Playbook: a curated library of video guides covering every stage of buying and selling property in Singapore. From HDB processes to condo upgrades, learn at your own pace.",
  path: "/playbook",
});

export default async function PlaybookPage() {
  const dbVideos = await getPlaybookVideos().catch(() => []);
  const dbSlugs = new Set(dbVideos.map((v) => v.slug));
  const placeholders = PLAYBOOK_VIDEOS.filter((v) => !dbSlugs.has(v.slug));
  const videos = [...dbVideos, ...placeholders];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Playbook", path: "/playbook" },
        ])}
      />
      {videoObjectsSchema(videos).map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <Navbar />
      <main className="bg-white">
        <PlaybookHero />
        <Suspense fallback={null}>
          <PlaybookLibrary videos={videos} />
        </Suspense>
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
