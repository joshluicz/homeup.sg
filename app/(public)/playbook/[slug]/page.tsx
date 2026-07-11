import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleBody } from "@/components/sections/ArticleBody";
import { articleHasInlineFaq, parsePlaybookArticleBlocks } from "@/lib/playbook/article-format";
import { articleSectionsToBlocks } from "@/lib/playbook/article-sections";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { PlaybookReturnLink } from "@/components/playbook/PlaybookReturnLink";
import { PlaybookArticleHeader } from "@/components/sections/PlaybookArticleHeader";
import { PlaybookArticleHeroMedia } from "@/components/sections/PlaybookArticleHeroMedia";
import {
  getAllPlaybookSlugs,
  getPlaybookVideoBySlugServer,
} from "@/lib/playbook/server-queries";
import { getKnownPlaybookArticleSlugs } from "@/lib/playbook/article-slugs";
import { resolveArticleThumbnail } from "@/lib/playbook/article-thumbnails";
import { getPlaybookAgentName, inferPlaybookAgentSlug } from "@/lib/playbook/agent-attribution";
import { getAgentBySlug } from "@/lib/data/agents";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  personSchema,
  speakableWebPageSchema,
} from "@/lib/seo/schema";

export const dynamicParams = true;
// Pre-rendered via generateStaticParams at build; updated only via explicit admin revalidation.
// Avoid force-static — it prevented Vercel from serving PRERENDER HTML (caused blanket 5xx).
export const maxDuration = 60;

type ArticlePageProps = { params: { slug: string } };

export async function generateStaticParams() {
  const [dbSlugs, knownSlugs] = await Promise.all([
    getAllPlaybookSlugs(),
    Promise.resolve(getKnownPlaybookArticleSlugs()),
  ]);
  const slugs = [...new Set([...dbSlugs, ...knownSlugs])].filter(Boolean);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const video = await getPlaybookVideoBySlugServer(params.slug);
  if (!video?.article?.trim()) notFound();

  return buildPageMetadata({
    title: video.title,
    description:
      video.metaDescription ||
      video.description ||
      `${video.title} — a HomeUP property guide for Singapore homeowners.`,
    path: `/playbook/${video.slug}`,
    ogImage: resolveArticleThumbnail(video) || video.thumbnail || undefined,
    ogImageAlt: video.title,
  });
}

export default async function PlaybookArticlePage({ params }: ArticlePageProps) {
  const video = await getPlaybookVideoBySlugServer(params.slug);
  if (!video?.article?.trim()) notFound();

  const hasFaq = (video.faq?.length ?? 0) > 0;
  const usesStructuredSections = Boolean(video.articleSections);
  const articleBlocks = usesStructuredSections
    ? articleSectionsToBlocks(video.articleSections!)
    : parsePlaybookArticleBlocks(video.article!);
  const showStructuredFaq = articleHasInlineFaq(articleBlocks);
  const showDbFaq = hasFaq && !showStructuredFaq;
  const inlineFaqBlock = articleBlocks.find(
    (block): block is Extract<typeof articleBlocks[number], { kind: "faq" }> => block.kind === "faq",
  );
  const faqSchemaItems =
    hasFaq ? video.faq! : inlineFaqBlock?.items?.length ? inlineFaqBlock.items : [];
  const authorSlug = inferPlaybookAgentSlug(video);
  const author = getAgentBySlug(authorSlug);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Playbook", path: "/playbook" },
            { name: video.title, path: `/playbook/${video.slug}` },
          ]),
          articleSchema(video, authorSlug),
          ...(author ? [personSchema(author)] : []),
          ...(faqSchemaItems.length > 0 ? [faqSchema(faqSchemaItems)] : []),
          speakableWebPageSchema({
            path: `/playbook/${video.slug}`,
            name: video.title,
            cssSelectors: [".playbook-article-body", ".speakable-faq-answer"],
          }),
        ]}
      />
      <Navbar />
      <main className="playbook-article-theme">
        <article className="container-page py-8 sm:py-12">
          <div className="mx-auto max-w-[680px]">
            <PlaybookArticleHeader
              video={video}
              hideDescription={articleBlocks.some((block) => block.kind === "quick_answer")}
            />
            <PlaybookArticleHeroMedia video={video} />

            <div className="mt-10 sm:mt-12">
              <ArticleBody markdown={video.article!} articleSections={video.articleSections} />
            </div>

            {showDbFaq && (
              <section className="playbook-article-body mt-14 border-t border-neutral-200 pt-10">
                <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                  Frequently asked questions
                </h2>
                <div className="mt-6 divide-y divide-neutral-200">
                  {video.faq!.map((item, i) => (
                    <details key={i} className="group py-5">
                      <summary className="cursor-pointer list-none text-base font-semibold text-neutral-900 marker:content-none">
                        {item.q}
                      </summary>
                      <p className="speakable-faq-answer mt-3 text-base leading-relaxed text-neutral-700">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <footer className="mt-14 border-t border-neutral-200 pt-8">
              <p className="text-sm font-medium text-neutral-500">
                Written by{" "}
                <span className="font-semibold text-neutral-800">{getPlaybookAgentName(video)}</span>
                {" · "}
                Singapore property guides for buyers, sellers, and upgraders.
              </p>
              <PlaybookReturnLink className="mt-4 inline-flex font-semibold text-primary-600 hover:text-primary-700">
                ← Back to Playbook
              </PlaybookReturnLink>
            </footer>
          </div>
        </article>

        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
