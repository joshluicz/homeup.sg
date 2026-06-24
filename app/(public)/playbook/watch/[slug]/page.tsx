import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaybookReturnLink } from "@/components/playbook/PlaybookReturnLink";
import { CtaBanner } from "@/components/sections/CtaBanner";
import {
  getSheetVideoBySlug,
  PLAYBOOK_SHEET_VIDEOS,
} from "@/lib/data/playbook-sheet-videos";
import {
  isDirectVideoFile,
  resolveThumbnail,
  toEmbedUrl,
} from "@/lib/playbook/embed";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const dynamicParams = true;

type WatchPageProps = { params: { slug: string } };

export async function generateStaticParams() {
  return PLAYBOOK_SHEET_VIDEOS.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({ params }: WatchPageProps) {
  const video = getSheetVideoBySlug(params.slug);
  if (!video) return { title: "Video Not Found" };

  return buildPageMetadata({
    title: video.title,
    description: `${video.title} — HomeUP property video tip.`,
    path: `/playbook/watch/${video.slug}`,
    ogImage: resolveThumbnail(video.thumbnail, video.videoUrl) || undefined,
    ogImageAlt: video.title,
  });
}

export default function PlaybookWatchPage({ params }: WatchPageProps) {
  const video = getSheetVideoBySlug(params.slug);
  if (!video?.videoUrl?.trim()) notFound();

  const thumb = resolveThumbnail(video.thumbnail, video.videoUrl);

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
            <div className="overflow-hidden rounded-2xl bg-neutral-950 shadow-xl">
              <div className="relative aspect-[9/16] w-full">
                {isDirectVideoFile(video.videoUrl) ? (
                  <video
                    src={video.videoUrl}
                    title={video.title}
                    controls
                    autoPlay
                    playsInline
                    poster={thumb}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <iframe
                    src={`${toEmbedUrl(video.videoUrl)}?autoplay=1`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                )}
              </div>
            </div>

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
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
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
