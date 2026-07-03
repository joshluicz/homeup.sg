"use client";

import { parsePlaybookArticleBlocks } from "@/lib/playbook/article-format";
import { PlaybookStructuredArticle } from "@/components/sections/PlaybookStructuredArticle";
import { PlaybookArticleMarkdown } from "@/components/sections/PlaybookArticleMarkdown";
import { PlaybookArticleHtml } from "@/components/sections/PlaybookArticleHtml";
import { normalizePlaybookMarkdown } from "@/lib/playbook/markdown";
import { isHtmlContent } from "@/components/admin/RichArticleEditor";

/**
 * Renders a playbook article. Handles three content formats:
 *  1. Rich HTML — produced by the WYSIWYG editor (new articles)
 *  2. Structured Markdown — legacy articles with section labels
 *  3. Plain Markdown — legacy articles without section labels
 */
export function ArticleBody({ markdown }: { markdown: string }) {
  if (!markdown?.trim()) return null;

  // New articles saved by the WYSIWYG editor are stored as HTML
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
