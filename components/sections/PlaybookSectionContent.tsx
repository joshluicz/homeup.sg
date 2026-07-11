"use client";

import { isHtmlContent } from "@/lib/playbook/is-html-content";
import { PlaybookArticleHtmlContent } from "@/components/sections/PlaybookArticleHtmlContent";
import { PlaybookArticleMarkdown } from "@/components/sections/PlaybookArticleMarkdown";

type Props = {
  content: string;
  variant?: "default" | "compact" | "callout";
};

/** Renders section body as sanitized HTML (TipTap) or markdown (legacy). */
export function PlaybookSectionContent({ content, variant = "default" }: Props) {
  if (!content?.trim()) return null;

  if (isHtmlContent(content)) {
    return <PlaybookArticleHtmlContent html={content} variant={variant} />;
  }

  return <PlaybookArticleMarkdown content={content} variant={variant} />;
}
