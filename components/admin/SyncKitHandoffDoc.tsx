"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import Link from "next/link";

const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "mailto"],
  },
};

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-6 font-display text-2xl font-bold text-neutral-900 sm:text-3xl">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-4 mt-10 border-b border-neutral-200 pb-2 text-lg font-bold text-neutral-900 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-8 text-base font-bold text-neutral-900">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 text-sm leading-relaxed text-neutral-700">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm text-neutral-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-neutral-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-700 hover:underline"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href ?? "#"} className="font-medium text-primary-700 hover:underline">
        {children}
      </Link>
    );
  },
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-neutral-900 px-4 py-3 text-xs text-neutral-100">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-800">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-xs text-neutral-100">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-6 overflow-x-auto rounded-xl border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-neutral-50">{children}</thead>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-2.5 text-sm text-neutral-700">{children}</td>,
  tr: ({ children }) => <tr className="divide-x divide-neutral-100 border-t border-neutral-100">{children}</tr>,
  hr: () => <hr className="my-8 border-neutral-200" />,
  strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
};

export function SyncKitHandoffDoc({ content }: { content: string }) {
  return (
    <article className="max-w-3xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
