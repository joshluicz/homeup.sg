import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaybookScrollRestore } from "@/components/playbook/PlaybookScrollRestore";
import { PlaybookHero } from "@/components/sections/PlaybookHero";
import { PlaybookJourney } from "@/components/sections/PlaybookJourney";
import { PlaybookLibrary } from "@/components/sections/PlaybookLibrary";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Property Playbook | Video Guides",
  description:
    "The HomeUP Playbook: a curated library of video guides covering every stage of buying and selling property in Singapore. From HDB processes to condo upgrades, learn at your own pace.",
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

        {/* ── PLAYBOOK JOURNEY: stage nav + content sections + sticky WA CTA ── */}
        <PlaybookJourney />

        <Suspense fallback={null}>
          {/* PlaybookLibrary fetches live from Supabase on mount.
              Starts empty so no placeholder cards show before the real videos load. */}
          <PlaybookLibrary videos={[]} />
        </Suspense>
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
