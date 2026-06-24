import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaybookEmbeddedVideoPlayer } from "@/components/playbook/PlaybookEmbeddedVideoPlayer";
import { PlaybookReturnLink } from "@/components/playbook/PlaybookReturnLink";
import { CtaBanner } from "@/components/sections/CtaBanner";
import {
  getAllWatchSlugsServer,
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

  return buildPageMetadata({
    title: video.title,
    description: `${video.title} — HomeUP property video tip.`,
    path: `/playbook/watch/${video.slug}`,
    ogImage: resolveThumbnail(video.thumbnail, video.videoUrl) || undefined,
    ogImageAlt: video.title,
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
          <PlaybookReturnLink>← Back to Playbook</PlaybookReturnLink>

          <div className="mx-auto mt-8 max-w-lg">
            <PlaybookEmbeddedVideoPlayer
              videoUrl={video.videoUrl}
              title={video.title}
              thumbnail={video.thumbnail}
              autoplay
              aspect="portrait"
              playerClassName="rounded-2xl shadow-xl ring-1 ring-neutral-200"
            />

            <div className="mt-6">
              <h1 className="font-display text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                {video.title}
              </h1>
              {video.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {video.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href="/playbook"
                className="mt-6 inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                Browse more tips
              </Link>
            </div>
          </div>
        </div>
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
