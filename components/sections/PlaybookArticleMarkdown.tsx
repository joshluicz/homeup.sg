"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { normalizePlaybookMarkdown } from "@/lib/playbook/markdown";
import { trackWhatsAppClick } from "@/lib/analytics";
import { PlaybookArticleFigure } from "@/components/sections/PlaybookArticleFigure";
import { cn } from "@/lib/utils";

type PlaybookArticleMarkdownProps = {
  content: string;
  variant?: "default" | "compact" | "callout";
};

function buildMarkdownComponents(variant: PlaybookArticleMarkdownProps["variant"]): Components {
  const paragraphClass =
    variant === "compact"
      ? "mb-4 text-base font-normal leading-[1.8] text-neutral-800 last:mb-0"
      : variant === "callout"
        ? "mb-4 text-base font-medium leading-[1.75] text-neutral-900 last:mb-0 sm:text-lg"
        : "mb-5 text-base font-normal leading-[1.8] text-neutral-800 last:mb-0";

  const isStructuralHeading = (value: React.ReactNode) => {
    const text = String(value).trim().toLowerCase().replace(/:$/, "");
    return ["quick answer", "introduction", "how homeup approaches this", "conclusion", "faq"].includes(
      text,
    );
  };

  return {
    h2: ({ children }) => {
      if (variant === "callout" && isStructuralHeading(children)) return null;
      return (
        <h2 className="mb-4 mt-10 font-display text-xl font-bold leading-snug text-neutral-900 first:mt-0 sm:text-2xl">
          {children}
        </h2>
      );
    },
    h3: ({ children }) => (
      <h3 className="mb-3 mt-8 font-display text-lg font-bold leading-snug text-neutral-900 sm:text-xl">
        {children}
      </h3>
    ),
    p: ({ children }) => <p className={paragraphClass}>{children}</p>,
    ul: ({ children }) => (
      <ul className="mb-6 mt-1 list-disc space-y-2 pl-5 text-base leading-[1.75] text-neutral-800 marker:text-neutral-400">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-6 mt-1 list-decimal space-y-2 pl-5 text-base leading-[1.75] text-neutral-800 marker:font-semibold">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-neutral-300 pl-5 text-base leading-[1.75] text-neutral-700">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-10 border-neutral-200" />,
    strong: ({ children }) => (
      <strong className="font-semibold text-neutral-900">{children}</strong>
    ),
    a: ({ href, children }) => {
      const isWaLink = href?.startsWith("/go/whatsapp");
      return (
        <a
          href={href}
          className="font-semibold text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-800 hover:decoration-primary-500"
          target={href?.startsWith("http") ? "_blank" : undefined}
          rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          onClick={
            isWaLink
              ? () => trackWhatsAppClick(href ?? "/go/whatsapp")
              : undefined
          }
        >
          {children}
        </a>
      );
    },
    table: ({ children }) => (
      <div className="my-8 overflow-x-auto border border-neutral-200 bg-white [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b-2 border-neutral-900 bg-white">{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-neutral-200 last:border-b-0">{children}</tr>,
    th: ({ children }) => (
      <th className="border-r border-neutral-200 px-4 py-3 text-left align-top text-sm font-bold text-neutral-900 last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-r border-neutral-200 px-4 py-3 align-top text-sm leading-relaxed text-neutral-800 last:border-r-0">
        {children}
      </td>
    ),
    img: ({ src, alt }) => {
      if (!src || typeof src !== "string") return null;
      return <PlaybookArticleFigure src={src} alt={alt} variant="inline" />;
    },
  };
}

// Extended sanitize schema — allows span/u/s with limited inline styles so that
// rich-text formatting (font family, text colour, underline, strikethrough) from
// the WYSIWYG editor is preserved when articles are rendered publicly.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["style", /^(font-family|color|font-size):[^;]{0,120}$/],
    ],
    "*": [
      ...(defaultSchema.attributes?.["*"] ?? []),
      ["style", /^text-align:\s*(left|center|right|justify)$/],
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "u",
    "s",
    "span",
  ].filter((v, i, a) => a.indexOf(v) === i),
};

export function PlaybookArticleMarkdown({
  content,
  variant = "default",
}: PlaybookArticleMarkdownProps) {
  if (!content?.trim()) return null;

  const markdown = normalizePlaybookMarkdown(content);

  return (
    <div className={cn(variant === "callout" && "text-neutral-900")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={buildMarkdownComponents(variant)}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
