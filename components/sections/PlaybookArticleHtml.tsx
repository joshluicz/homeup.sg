"use client";

import DOMPurify from "isomorphic-dompurify";

type Props = { html: string };

/**
 * Properties allowed in inline `style` attributes on the public article page.
 * We intentionally omit font-family, font-size, line-height, margin, padding, etc.
 * so that pasted Google Docs content cannot override the brand typography.
 */
const ALLOWED_STYLE_PROPS = new Set(["text-align", "color"]);

/**
 * Strip disallowed CSS properties from every inline style="…" attribute.
 * Keeps only text-align (layout) and color (emphasis), removing font-family,
 * font-size, background-color, line-height, margin, padding and anything else
 * that would break visual consistency with the rest of the site.
 */
function cleanInlineStyles(html: string): string {
  return html.replace(/\bstyle="([^"]*)"/gi, (_match, styleContent: string) => {
    const kept = styleContent
      .split(";")
      .map((rule) => rule.trim())
      .filter((rule) => {
        const prop = rule.split(":")[0]?.trim().toLowerCase() ?? "";
        return ALLOWED_STYLE_PROPS.has(prop) && rule.includes(":");
      });
    if (!kept.length) return "";
    return `style="${kept.join("; ")}"`;
  });
}

/**
 * Section labels that correspond to the structured article format.
 * When a paragraph contains only one of these labels, we convert it to
 * a styled eyebrow heading so it matches the PlaybookStructuredArticle design.
 */
const SECTION_LABEL_RE =
  /^(Quick Answer|Introduction|How HomeUp Approaches This|Conclusion|FAQ):?$/i;

/**
 * Convert section-label-only <p> elements into eyebrow headings.
 * Handles labels that may be wrapped in inline tags like <strong> or <em>.
 */
function applySectionEyebrows(html: string): string {
  return html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (_match, attrs, inner) => {
    // Strip inner tags to get bare text for label detection
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (SECTION_LABEL_RE.test(text)) {
      const label = text.replace(/:$/, "").trim();
      return `<p${attrs} class="article-section-eyebrow">${label}</p>`;
    }
    return _match;
  });
}

/**
 * Wrap bare <table> elements in a scroll container to match the Markdown renderer.
 */
function wrapTables(html: string): string {
  return html
    .replace(/<table(\s)/gi, '<div class="table-wrapper"><table$1')
    .replace(/<\/table>/gi, "</table></div>");
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

  // 3. Wrap tables in scroll containers
  const withWrappedTables = wrapTables(sectioned);

  // 4. Sanitise with DOMPurify
  const clean = DOMPurify.sanitize(withWrappedTables, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "hr",
      "a", "img",
      "span", "div",
      "table", "thead", "tbody", "tr", "th", "td",
      "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel", "style", "class"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
    ADD_ATTR: ["target"],
  });

  return (
    <div
      className="playbook-article-body playbook-article-html max-w-none"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
