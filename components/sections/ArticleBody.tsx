"use client";

import { parsePlaybookArticleBlocks } from "@/lib/playbook/article-format";
import { PlaybookStructuredArticle } from "@/components/sections/PlaybookStructuredArticle";
import { PlaybookArticleMarkdown } from "@/components/sections/PlaybookArticleMarkdown";
import { normalizePlaybookMarkdown } from "@/lib/playbook/markdown";

/**
 * Renders a playbook article with structured sections when labels are present,
 * otherwise falls back to standard markdown.
 */
export function ArticleBody({ markdown }: { markdown: string }) {
  if (!markdown?.trim()) return null;

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
