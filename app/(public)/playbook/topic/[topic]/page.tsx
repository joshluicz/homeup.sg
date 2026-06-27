import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { PlaybookArticleCard } from "@/components/playbook/PlaybookArticleCard";
import { PlaybookReturnLink } from "@/components/playbook/PlaybookReturnLink";
import { getPlaybookArticlesByTopicServer } from "@/lib/playbook/server-queries";
import { PLAYBOOK_JOURNEY_SECTIONS, PLAYBOOK_TOPICS, TOPIC_LABELS, type PlaybookTopic } from "@/lib/data/playbook";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

type TopicPageProps = { params: { topic: string } };

export function generateStaticParams() {
  return PLAYBOOK_TOPICS.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: TopicPageProps) {
  const topic = params.topic as PlaybookTopic;
  if (!PLAYBOOK_TOPICS.includes(topic)) return { title: "Not Found" };
  return buildPageMetadata({
    title: `${TOPIC_LABELS[topic]} | Playbook`,
    description: PLAYBOOK_JOURNEY_SECTIONS.find((s) => s.topic === topic)?.description ?? "",
    path: `/playbook/topic/${topic}`,
  });
}

export default async function TopicPage({ params }: TopicPageProps) {
  const topic = params.topic as PlaybookTopic;
  if (!PLAYBOOK_TOPICS.includes(topic)) notFound();

  const articlesByTopic = await getPlaybookArticlesByTopicServer();
  const articles = articlesByTopic[topic].filter((a) => a.slug && a.article?.trim());

  const section = PLAYBOOK_JOURNEY_SECTIONS.find((s) => s.topic === topic)!;

  return (
    <>
      <Navbar />
      <main className="bg-[#faf9f5] min-h-screen">
        <div className="container-page py-10 sm:py-14">
          {/* Back link */}
          <PlaybookReturnLink className="inline-flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
            Back to Playbook
          </PlaybookReturnLink>

          {/* Header */}
          <div className="mt-8 max-w-2xl">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {section.step}
            </span>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary-600">
              Stage {section.step}
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              {TOPIC_LABELS[topic]}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500 sm:text-base">
              {section.description}
            </p>
            <p className="mt-3 text-sm text-neutral-400">
              {articles.length} article{articles.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Article grid */}
          {articles.length === 0 ? (
            <p className="mt-16 text-center text-sm text-neutral-500">Articles coming soon.</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <PlaybookArticleCard key={article.id} article={article} variant="mockup" />
              ))}
            </div>
          )}
        </div>
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
