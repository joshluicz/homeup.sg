"use client";

import { normalizeHtmlArticle } from "@/lib/playbook/normalize-html-article";
import { prepareSectionHtml } from "@/lib/playbook/convert-html-markdown-tables";
import { cleanInlineStyles } from "@/lib/playbook/sanitize-article-html";
import { sanitizeArticleHtmlLite } from "@/lib/playbook/html-text-utils";
import { cn } from "@/lib/utils";

type Props = {
  html: string;
  variant?: "default" | "compact" | "callout";
};

const variantClasses = {
  default: "text-base leading-[1.8] text-neutral-800",
  compact: "text-base leading-[1.8] text-neutral-800",
  callout: "text-base font-medium leading-[1.75] text-neutral-900 sm:text-lg",
};

/**
 * Renders a single sanitized HTML snippet from a structured article section field.
 */
export function PlaybookArticleHtmlContent({ html, variant = "default" }: Props) {
  if (!html?.trim()) return null;

  const clean = sanitizeArticleHtmlLite(cleanInlineStyles(prepareSectionHtml(normalizeHtmlArticle(html))));

  return (
    <div
      className={cn(
        "playbook-article-html max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        variantClasses[variant],
      )}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
