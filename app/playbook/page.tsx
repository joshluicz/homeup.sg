import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PlaybookHero } from "@/components/sections/PlaybookHero";
import { PlaybookLibrary } from "@/components/sections/PlaybookLibrary";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { PLAYBOOK_VIDEOS } from "@/lib/data/playbook";

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Property Playbook — Video Guides",
  description:
    "The HomeUP Playbook: a curated library of video guides covering every stage of buying and selling property in Singapore. From HDB processes to condo upgrades, learn at your own pace.",
  alternates: { canonical: "https://lp.homeup.sg/playbook" },
  openGraph: {
    url: "https://lp.homeup.sg/playbook",
    title: "The HomeUP Playbook | Property Video Guides",
    description:
      "Video guides covering every stage of Singapore property — selling, buying, market insights, and more. Free for all HomeUP clients.",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
//
// BACKEND INTEGRATION NOTE:
//   This is a server component. When your backend / CMS is ready, replace
//   the `PLAYBOOK_VIDEOS` import with an async data fetch:
//
//     import { getPlaybookVideos } from "@/lib/data/playbook";
//     const videos = await getPlaybookVideos();
//
//   Next.js will automatically handle caching and ISR for you.
//
export default function PlaybookPage() {
  // Ready for async: const videos = await getPlaybookVideos();
  const videos = PLAYBOOK_VIDEOS;

  return (
    <>
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
