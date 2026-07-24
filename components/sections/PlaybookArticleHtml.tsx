"use client";

import { normalizeHtmlArticle } from "@/lib/playbook/normalize-html-article";
import { trackWhatsAppClick } from "@/lib/analytics";
import {
  convertMarkdownTablesInHtml,
  wrapHtmlTables,
} from "@/lib/playbook/convert-html-markdown-tables";
import { cleanInlineStyles, sanitizeArticleHtml } from "@/lib/playbook/sanitize-article-html";

type Props = { html: string };

/**
 * Section labels that correspond to the structured article format.
 * When a paragraph contains only one of these labels, we convert it to
 * a styled eyebrow heading so it matches the PlaybookStructuredArticle design.
 */
const SECTION_LABEL_RE =
  /^(Quick Answer|Introduction|How HomeUp Approaches This|Conclusion|FAQ):?$/i;

/**
 * Convert section-label-only block elements into eyebrow headings.
 * Matches <p> and <h1>–<h6> so labels pasted from Google Docs (which may
 * arrive as heading nodes) are normalised to eyebrows in the same pass.
 * Adds a slug-specific modifier class (e.g. article-section-eyebrow--quick-answer)
 * so downstream CSS and wrapSectionBoxes can target individual sections.
 * Handles labels wrapped in inline tags like <strong> or <em>.
 */
function applySectionEyebrows(html: string): string {
  return html.replace(/<(p|h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi, (_match, _tag, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (SECTION_LABEL_RE.test(text)) {
      const label = text.replace(/:$/, "").trim();
      const slug = label.toLowerCase().replace(/\s+/g, "-");
      // Remove any existing class from attrs to avoid duplicate class attributes
      const cleanAttrs = attrs.replace(/\s*class="[^"]*"/, "");
      return `<p${cleanAttrs} class="article-section-eyebrow article-section-eyebrow--${slug}">${label}</p>`;
    }
    return _match;
  });
}

/**
 * Sections that should be rendered inside a card-style container box,
 * matching the PlaybookStructuredArticle visual treatment.
 */
const BOX_SECTION_SLUGS = new Set(["quick-answer", "how-homeup-approaches-this"]);

/**
 * Wrap Quick Answer and "How HomeUp Approaches This" sections in a styled
 * container div so they match the card layout in PlaybookStructuredArticle.
 * Each box spans from its eyebrow paragraph to just before the next eyebrow,
 * h2, or end of content.
 */
function wrapSectionBoxes(html: string): string {
  return html.replace(
    /(<p[^>]*class="article-section-eyebrow article-section-eyebrow--([^"\s]+)"[^>]*>[\s\S]*?<\/p>)([\s\S]*?)(?=<p[^>]*class="article-section-eyebrow|<h[2-6][\s>]|$)/gi,
    (match, eyebrowTag, slug, content) => {
      if (!BOX_SECTION_SLUGS.has(slug)) return match;
      return `<div class="article-section-box article-section-box--${slug}">${eyebrowTag}${content}</div>`;
    },
  );
}

/**
 * Renders rich HTML produced by the WYSIWYG article editor.
 * Content is sanitised with DOMPurify before being injected.
 *
 * Pre-processing removes font-family/font-size overrides introduced by
 * Google Docs pastes and converts structural section labels into eyebrow
 * headings so they match the rest of the HomeUP article design system.
 */
export function PlaybookArticleHtml({ html }: Props) {
  if (!html?.trim()) return null;

  // 1. Strip disallowed inline styles (font-family, font-size, etc.)
  const stylesCleaned = cleanInlineStyles(html);

  // 2. Promote section-label paragraphs to eyebrow headings
  const sectioned = applySectionEyebrows(stylesCleaned);

  // 3. Convert Markdown syntax that got saved as plain text inside <p> elements
  //    (## headings, ![images](url), **bold** / *italic*)
  const mdNormalised = normalizeHtmlArticle(sectioned);

  // 4. Convert Markdown pipe-table syntax in <p> elements to real <table> HTML
  const withRealTables = convertMarkdownTablesInHtml(mdNormalised);

  // 5. Wrap Quick Answer / HomeUp sections in card containers
  const withBoxes = wrapSectionBoxes(withRealTables);

  // 6. Wrap tables in scroll containers
  const withWrappedTables = wrapHtmlTables(withBoxes);

  // 7. Sanitise (lazy DOMPurify — no top-level import; safe on Vercel SSR)
  const clean = sanitizeArticleHtml(withWrappedTables);

  return (
    <div
      className="playbook-article-body playbook-article-html max-w-none"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
      onClick={(e) => {
        const anchor = (e.target as HTMLElement).closest("a");
        if (anchor?.href && anchor.getAttribute("href")?.startsWith("/go/whatsapp")) {
          trackWhatsAppClick(anchor.getAttribute("href") ?? "/go/whatsapp");
        }
      }}
    />
  );
}
