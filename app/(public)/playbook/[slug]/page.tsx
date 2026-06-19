import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleBody } from "@/components/sections/ArticleBody";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { CATEGORY_LABELS } from "@/lib/data/playbook";
import {
  getAllPlaybookSlugs,
  getPlaybookVideoBySlugServer,
} from "@/lib/playbook/server-queries";
import { toEmbedUrl, isDirectVideoFile } from "@/lib/playbook/embed";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  speakableWebPageSchema,
  videoObjectsSchema,
} from "@/lib/seo/schema";

// Vercel (dynamic) hosting: serve new/edited articles WITHOUT a redeploy.
//  - dynamicParams: slugs added after build render on demand (instead of 404).
//  - revalidate: existing pages refresh on a schedule; the admin save route also
//    triggers on-demand revalidation (revalidatePath) so edits go live immediately.
// NOTE: incompatible with a STATIC_EXPORT=true build — keep STATIC_EXPORT unset on Vercel.
export const dynamicParams = true;
export const revalidate = 3600;

// generateStaticParams still pre-renders the articles that exist at build time (good for SEO);
// the sentinel slug keeps it valid when none exist yet and renders notFound().
const FALLBACK_SLUG = "_";

type ArticlePageProps = { params: { slug: string } };

export async function generateStaticParams() {
  const slugs = await getAllPlaybookSlugs();
  if (slugs.length === 0) return [{ slug: FALLBACK_SLUG }];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const video = await getPlaybookVideoBySlugServer(params.slug);
  if (!video) return { title: "Guide Not Found" };

  return buildPageMetadata({
    title: video.title,
    description:
      video.metaDescription ||
      video.description ||
      `${video.title} — a HomeUP property guide for Singapore homeowners.`,
    path: `/playbook/${video.slug}`,
    ogImage: video.thumbnail || undefined,
    ogImageAlt: video.title,
  });
}

export default async function PlaybookArticlePage({ params }: ArticlePageProps) {
  const video = await getPlaybookVideoBySlugServer(params.slug);
  if (!video) notFound();

  const hasFaq = (video.faq?.length ?? 0) > 0;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Playbook", path: "/playbook" },
            { name: video.title, path: `/playbook/${video.slug}` },
          ]),
          articleSchema(video),
          ...(hasFaq ? [faqSchema(video.faq!)] : []),
          ...(video.videoUrl && video.thumbnail
            ? videoObjectsSchema([video])
            : []),
          speakableWebPageSchema({
            path: `/playbook/${video.slug}`,
            name: video.title,
            cssSelectors: [".speakable-faq-answer"],
          }),
        ]}
      />
      <Navbar />
      <main className="bg-white">
        <article className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-neutral-500">
            <Link href="/playbook" className="hover:text-primary-600">
              ← Back to Playbook
            </Link>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            {CATEGORY_LABELS[video.category]}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
            {video.title}
          </h1>
          {video.description && (
            <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-neutral-600">
              {video.description}
            </p>
          )}

          {/* Video */}
          {video.videoUrl && (
            <div className="mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-neutral-900">
              {isDirectVideoFile(video.videoUrl) ? (
                <video src={video.videoUrl} title={video.title} controls playsInline className="h-full w-full" />
              ) : (
                <iframe
                  src={toEmbedUrl(video.videoUrl)}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              )}
            </div>
          )}

          {/* Article */}
          {video.article && (
            <div className="mt-10">
              <ArticleBody markdown={video.article} />
            </div>
          )}

          {/* FAQ */}
          {hasFaq && (
            <section className="mt-12 border-t border-neutral-200 pt-10">
              <h2 className="font-display text-2xl font-bold text-neutral-900">
                Frequently asked questions
              </h2>
              <div className="mt-6 divide-y divide-neutral-200">
                {video.faq!.map((item, i) => (
                  <details key={i} className="group py-4">
                    <summary className="cursor-pointer list-none text-base font-semibold text-neutral-900 marker:content-none">
                      {item.q}
                    </summary>
                    <p className="speakable-faq-answer mt-3 leading-relaxed text-neutral-600">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
