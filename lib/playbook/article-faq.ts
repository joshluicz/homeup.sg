import type { FaqEntry, PlaybookVideo } from "@/lib/data/playbook";
import { extractFaqFromArticleBody } from "@/lib/playbook/backfill-article-sections";
import type { PlaybookArticleBlock } from "@/lib/playbook/article-format";
import { isHtmlContent } from "@/lib/playbook/is-html-content";

/** Prefer faq column, then inline faq block, then body extraction. */
export function resolvePlaybookArticleFaq(
  video: Pick<PlaybookVideo, "faq" | "article" | "articleSections">,
  blocks: PlaybookArticleBlock[],
): FaqEntry[] {
  const fromColumn = (video.faq ?? []).filter((f) => f.q?.trim() && f.a?.trim());
  if (fromColumn.length > 0) return fromColumn;

  const faqBlock = blocks.find((b) => b.kind === "faq");
  if (faqBlock && faqBlock.kind === "faq") {
    const fromBlock = faqBlock.items.filter((f) => f.q?.trim() && f.a?.trim());
    if (fromBlock.length > 0) return fromBlock;
  }

  return extractFaqFromArticleBody(video.article ?? "");
}

/** Remove FAQ section from legacy article body when rendered separately as an accordion. */
export function omitFaqFromArticleMarkdown(content: string): string {
  const text = content?.trim() ?? "";
  if (!text) return text;

  if (isHtmlContent(text)) {
    const withoutEyebrow = text.replace(
      /<p[^>]*class="[^"]*article-section-eyebrow--faq[^"]*"[^>]*>[\s\S]*$/i,
      "",
    );
    return withoutEyebrow
      .replace(/(?:<p[^>]*>|<h[1-6][^>]*>)\s*FAQ:?\s*<\/(?:p|h[1-6])>[\s\S]*$/i, "")
      .trim();
  }

  return text.replace(/\nFAQ:\s*\n[\s\S]*$/i, "").trim();
}

export function filterFaqBlocks(blocks: PlaybookArticleBlock[]): PlaybookArticleBlock[] {
  return blocks.filter((block) => block.kind !== "faq");
}
