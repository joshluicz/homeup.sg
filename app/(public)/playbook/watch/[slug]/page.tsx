import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaybookExclusiveWatch } from "@/components/playbook/PlaybookExclusiveWatch";
import { PlaybookReturnLink } from "@/components/playbook/PlaybookReturnLink";
import { CtaBanner } from "@/components/sections/CtaBanner";
import {
  getAllWatchSlugsServer,
  getPlaybookVideoBySlugServer,
  getPlaybookVideoForWatchServer,
} from "@/lib/playbook/server-queries";
import { resolveThumbnail } from "@/lib/playbook/embed";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const dynamicParams = true;

type WatchPageProps = { params: { slug: string } };

export async function generateStaticParams() {
  const slugs = await getAllWatchSlugsServer();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: WatchPageProps) {
  const video = await getPlaybookVideoForWatchServer(params.slug);
  if (!video) return { title: "Video Not Found" };

  const article = await getPlaybookVideoBySlugServer(params.slug);
  const hasArticle = Boolean(article?.article?.trim());

  return buildPageMetadata({
    title: video.title,
    description: `${video.title} — HomeUP Playbook exclusive property tip.`,
    path: `/playbook/watch/${video.slug}`,
    ogImage: resolveThumbnail(video.thumbnail, video.videoUrl) || undefined,
    ogImageAlt: video.title,
    ...(hasArticle && {
      canonicalPath: `/playbook/${video.slug}`,
      robots: { index: false, follow: true },
    }),
  });
}

export default async function PlaybookWatchPage({ params }: WatchPageProps) {
  const video = await getPlaybookVideoForWatchServer(params.slug);
  if (!video?.videoUrl?.trim()) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Playbook", path: "/playbook" },
          { name: video.title, path: `/playbook/watch/${video.slug}` },
        ])}
      />
      <Navbar />
      <main className="bg-white">
        <div className="container-page py-8 sm:py-12">
          <PlaybookReturnLink className="text-neutral-500 hover:text-neutral-900">
            ← Back to Playbook
          </PlaybookReturnLink>

          <div className="mt-8">
            <PlaybookExclusiveWatch
              videoUrl={video.videoUrl}
              title={video.title}
              thumbnail={video.thumbnail}
              tags={video.tags}
              topic={video.topic}
              autoplay
              aspect="portrait"
              variant="page"
            />
          </div>
        </div>
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
