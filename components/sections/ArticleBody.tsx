"use client";

import {
  articleSectionsToBlocks,
  hasStructuredArticleContent,
  type ArticleSections,
} from "@/lib/playbook/article-sections";
import { parsePlaybookArticleBlocks } from "@/lib/playbook/article-format";
import { PlaybookStructuredArticle } from "@/components/sections/PlaybookStructuredArticle";
import { PlaybookArticleMarkdown } from "@/components/sections/PlaybookArticleMarkdown";
import { PlaybookArticleHtml } from "@/components/sections/PlaybookArticleHtml";
import { normalizePlaybookMarkdown } from "@/lib/playbook/markdown";
import { isHtmlContent } from "@/lib/playbook/is-html-content";

type ArticleBodyProps = {
  markdown: string;
  articleSections?: ArticleSections | null;
};

/**
 * Renders a playbook article. Prefers structured section fields when present;
 * otherwise falls back to legacy HTML / markdown blob parsing.
 */
export function ArticleBody({ markdown, articleSections }: ArticleBodyProps) {
  if (hasStructuredArticleContent(articleSections)) {
    const blocks = articleSectionsToBlocks(articleSections!);
    return <PlaybookStructuredArticle blocks={blocks} />;
  }

  if (!markdown?.trim()) return null;

  if (isHtmlContent(markdown)) {
    return <PlaybookArticleHtml html={markdown} />;
  }

  const blocks = parsePlaybookArticleBlocks(markdown);
  const isStructured = blocks.some((block) => block.kind !== "content");

  if (isStructured) {
    return <PlaybookStructuredArticle blocks={blocks} />;
  }

  const content = normalizePlaybookMarkdown(markdown);

  return (
    <div className="playbook-article-body max-w-none">
      <PlaybookArticleMarkdown content={content} />
    </div>
  );
}
