"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { normalizePlaybookMarkdown } from "@/lib/playbook/markdown";

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mb-4 mt-14 border-t border-neutral-200 pt-10 font-display text-2xl font-bold tracking-tight text-neutral-900 first:mt-0 first:border-t-0 first:pt-0 sm:text-[1.65rem]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-10 font-display text-xl font-bold tracking-tight text-neutral-900">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-6 text-base font-normal leading-[1.85] text-neutral-700 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-8 mt-2 list-disc space-y-3 pl-5 text-base leading-[1.75] text-neutral-700 marker:text-primary-600">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-8 mt-2 list-decimal space-y-3 pl-5 text-base leading-[1.75] text-neutral-700 marker:font-semibold marker:text-primary-600">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-4 border-primary-300 bg-primary-50/40 px-5 py-4 text-base leading-relaxed text-neutral-700">
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
      className="font-medium text-primary-600 underline decoration-primary-200 underline-offset-2 hover:text-primary-700 hover:decoration-primary-400"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
};

/**
 * Renders a Markdown article to sanitized HTML. Server-rendered so the full text
 * is present in the static export — required for SEO and AI answer engines (GEO).
 */
export function ArticleBody({ markdown }: { markdown: string }) {
  if (!markdown?.trim()) return null;

  const content = normalizePlaybookMarkdown(markdown);

  return (
    <div className="playbook-article-body max-w-none">
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
