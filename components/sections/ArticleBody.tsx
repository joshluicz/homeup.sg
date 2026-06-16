"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

/**
 * Renders a Markdown article to sanitized HTML. Server-rendered so the full text
 * is present in the static export — required for SEO and AI answer engines (GEO).
 */
export function ArticleBody({ markdown }: { markdown: string }) {
  if (!markdown?.trim()) return null;
  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-primary-600 prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
