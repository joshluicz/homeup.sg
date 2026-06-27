import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaybookScrollRestore } from "@/components/playbook/PlaybookScrollRestore";
import { PlaybookHero } from "@/components/sections/PlaybookHero";
import { PlaybookJourney } from "@/components/sections/PlaybookJourney";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { getPlaybookArticlesByTopicServer, getPlaybookVideosByTopicServer } from "@/lib/playbook/server-queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Property Playbook | Video Tips & Guides",
  description:
    "Unlimited tips for buyers, sellers and investors — plus in-depth HomeUP guides covering every stage of property in Singapore.",
  path: "/playbook",
});

export default async function PlaybookPage() {
  const [initialArticlesByTopic, initialVideosByTopic] = await Promise.all([
    getPlaybookArticlesByTopicServer(),
    getPlaybookVideosByTopicServer(),
  ]);

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
        <PlaybookJourney
          initialArticlesByTopic={initialArticlesByTopic}
          initialVideosByTopic={initialVideosByTopic}
        />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
