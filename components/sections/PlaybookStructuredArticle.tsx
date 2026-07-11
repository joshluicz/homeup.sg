"use client";

import { PlaybookFaqSection } from "@/components/playbook/PlaybookFaqSection";
import type { PlaybookArticleBlock } from "@/lib/playbook/article-format";
import { PlaybookArticleMarkdown } from "@/components/sections/PlaybookArticleMarkdown";
import { PlaybookSectionContent } from "@/components/sections/PlaybookSectionContent";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
      {children}
    </p>
  );
}

function QuickAnswerBlock({ body }: { body: string }) {
  if (!body.trim()) return null;

  return (
    <section className="mb-14">
      <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50/80 to-white px-6 py-6 sm:px-8 sm:py-7">
        <SectionEyebrow>Quick Answer</SectionEyebrow>
        <PlaybookSectionContent content={body} variant="callout" />
      </div>
    </section>
  );
}

function IntroductionBlock({ body }: { body: string }) {
  if (!body.trim()) return null;

  return (
    <section className="mb-14">
      <SectionEyebrow>Introduction</SectionEyebrow>
      <PlaybookSectionContent content={body} />
    </section>
  );
}

function QuestionSectionBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="mb-14 border-t border-neutral-100 pt-12">
      <h2 className="mb-5 font-display text-xl font-bold leading-snug text-neutral-900 sm:text-2xl">
        {title}
      </h2>
      <PlaybookSectionContent content={body} />
    </section>
  );
}

function HomeUpBlock({ body }: { body: string }) {
  return (
    <section className="mb-14 rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-6 sm:px-8 sm:py-7">
      <SectionEyebrow>How HomeUp Approaches This</SectionEyebrow>
      <PlaybookSectionContent content={body} />
    </section>
  );
}

function ConclusionBlock({ body }: { body: string }) {
  return (
    <section className="mb-14 border-t border-neutral-200 pt-12">
      <SectionEyebrow>Conclusion</SectionEyebrow>
      <PlaybookSectionContent content={body} />
    </section>
  );
}

function InlineFaqBlock({ items }: { items: Array<{ q: string; a: string }> }) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 pt-12">
      <PlaybookFaqSection items={items} className="border-t-0 pt-0" title="FAQ" />
    </section>
  );
}

export function PlaybookStructuredArticle({ blocks }: { blocks: PlaybookArticleBlock[] }) {
  return (
    <div className="playbook-article-body space-y-0">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "quick_answer":
            return <QuickAnswerBlock key={`quick-${index}`} body={block.body} />;
          case "introduction":
            return <IntroductionBlock key={`intro-${index}`} body={block.body} />;
          case "section":
            return (
              <QuestionSectionBlock
                key={`section-${block.title}-${index}`}
                title={block.title}
                body={block.body}
              />
            );
          case "homeup":
            return <HomeUpBlock key={`homeup-${index}`} body={block.body} />;
          case "conclusion":
            return <ConclusionBlock key={`conclusion-${index}`} body={block.body} />;
          case "faq":
            return <InlineFaqBlock key={`faq-${index}`} items={block.items} />;
          case "content":
            return (
              <div key={`content-${index}`} className="space-y-0">
                <PlaybookArticleMarkdown content={block.body} />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
