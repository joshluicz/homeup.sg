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
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-lg border border-neutral-300 bg-white shadow-sm [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b-2 border-neutral-300 bg-neutral-50">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-neutral-300 last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="border-r border-neutral-300 px-4 py-3 text-left align-top text-sm font-bold text-neutral-900 last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-r border-neutral-300 px-4 py-3 align-top text-sm leading-relaxed text-neutral-700 last:border-r-0">
      {children}
    </td>
  ),
  img: ({ src, alt }) => {
    if (!src) return null;
    const caption = alt?.trim();
    const showCaption = caption && caption !== "Article illustration";
    return (
      <figure className="my-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={caption || ""}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm"
          loading="lazy"
        />
        {showCaption && (
          <figcaption className="mt-2 text-center text-sm leading-relaxed text-neutral-500">
            {caption}
          </figcaption>
        )}
      </figure>
    );
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
