"use client";

import {
  articleSectionsToBlocks,
  hasStructuredArticleContent,
  type ArticleSections,
} from "@/lib/playbook/article-sections";
import { parsePlaybookArticleBlocks } from "@/lib/playbook/article-format";
import {
  filterFaqBlocks,
  omitFaqFromArticleMarkdown,
} from "@/lib/playbook/article-faq";
import { PlaybookStructuredArticle } from "@/components/sections/PlaybookStructuredArticle";
import { PlaybookArticleMarkdown } from "@/components/sections/PlaybookArticleMarkdown";
import { PlaybookArticleHtml } from "@/components/sections/PlaybookArticleHtml";
import { normalizePlaybookMarkdown } from "@/lib/playbook/markdown";
import { isHtmlContent } from "@/lib/playbook/is-html-content";

type ArticleBodyProps = {
  markdown: string;
  articleSections?: ArticleSections | null;
  /** When true, FAQ is rendered separately — strip it from the article body. */
  omitFaqFromBody?: boolean;
};

/**
 * Renders a playbook article. Prefers structured section fields when present;
 * otherwise falls back to legacy HTML / markdown blob parsing.
 */
export function ArticleBody({ markdown, articleSections, omitFaqFromBody = false }: ArticleBodyProps) {
  const bodyMarkdown = omitFaqFromBody ? omitFaqFromArticleMarkdown(markdown) : markdown;

  if (hasStructuredArticleContent(articleSections)) {
    let blocks = articleSectionsToBlocks(articleSections!);
    if (omitFaqFromBody) blocks = filterFaqBlocks(blocks);
    return <PlaybookStructuredArticle blocks={blocks} />;
  }

  if (!bodyMarkdown?.trim()) return null;

  if (isHtmlContent(bodyMarkdown)) {
    return <PlaybookArticleHtml html={bodyMarkdown} />;
  }

  const blocks = parsePlaybookArticleBlocks(bodyMarkdown);
  const displayBlocks = omitFaqFromBody ? filterFaqBlocks(blocks) : blocks;
  const isStructured = displayBlocks.some((block) => block.kind !== "content");

  if (isStructured) {
    return <PlaybookStructuredArticle blocks={displayBlocks} />;
  }

  const content = normalizePlaybookMarkdown(bodyMarkdown);

  return (
    <div className="playbook-article-body max-w-none">
      <PlaybookArticleMarkdown content={content} />
    </div>
  );
}
