"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { normalizePlaybookMarkdown } from "@/lib/playbook/markdown";
import { PlaybookArticleFigure } from "@/components/sections/PlaybookArticleFigure";

/** Editorial body styles aligned with Straits Times article pages — clean column, clear hierarchy. */
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mb-4 mt-12 font-display text-[1.35rem] font-bold leading-snug text-neutral-900 first:mt-0 sm:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-10 font-display text-lg font-bold leading-snug text-neutral-900 sm:text-xl">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-6 text-[1.0625rem] font-normal leading-[1.85] text-neutral-800">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-8 mt-1 list-disc space-y-2 pl-5 text-[1.0625rem] leading-[1.8] text-neutral-800 marker:text-neutral-400">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-8 mt-1 list-decimal space-y-2 pl-5 text-[1.0625rem] leading-[1.8] text-neutral-800 marker:font-semibold">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-2 border-neutral-900 pl-5 text-[1.0625rem] leading-[1.8] text-neutral-700">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-12 border-neutral-200" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-neutral-900">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-900"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-10 overflow-x-auto border border-neutral-300 bg-white [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b-2 border-neutral-900 bg-white">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-neutral-300 last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="border-r border-neutral-300 px-4 py-3 text-left align-top text-sm font-bold text-neutral-900 last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-r border-neutral-300 px-4 py-3 align-top text-sm leading-relaxed text-neutral-800 last:border-r-0">
      {children}
    </td>
  ),
  img: ({ src, alt }) => {
    if (!src) return null;
    return <PlaybookArticleFigure src={src} alt={alt} variant="inline" />;
  },
};

/**
 * Renders a Markdown article to sanitized HTML. Server-rendered so the full text
 * is present in the static export — required for SEO and AI answer engines (GEO).
 */
export function ArticleBody({ markdown }: { markdown: string }) {
  if (!markdown?.trim()) return null;

  const content = normalizePlaybookMarkdown(markdown);

  return (
    <div className="playbook-article-body max-w-none [&>p:first-of-type]:text-lg [&>p:first-of-type]:font-medium [&>p:first-of-type]:leading-[1.7] sm:[&>p:first-of-type]:text-xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
