import DOMPurify from "isomorphic-dompurify";

/** Properties allowed in inline style attributes on article HTML. */
export const ALLOWED_INLINE_STYLE_PROPS = new Set(["text-align", "color"]);

/** Strip disallowed CSS properties from inline style attributes. */
export function cleanInlineStyles(html: string): string {
  return html.replace(/\bstyle="([^"]*)"/gi, (_match, styleContent: string) => {
    const kept = styleContent
      .split(";")
      .map((rule) => rule.trim())
      .filter((rule) => {
        const prop = rule.split(":")[0]?.trim().toLowerCase() ?? "";
        return ALLOWED_INLINE_STYLE_PROPS.has(prop) && rule.includes(":");
      });
    if (!kept.length) return "";
    return `style="${kept.join("; ")}"`;
  });
}

const DOMPURIFY_OPTIONS = {
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
  ALLOWED_ATTR: ["href", "src", "alt", "target", "rel", "style", "class", "loading"],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
  ADD_ATTR: ["target"],
};

/** Sanitize rich-text HTML from the article editor for storage and display. */
export function sanitizeArticleHtml(html: string): string {
  if (!html?.trim()) return "";
  const cleaned = cleanInlineStyles(html);
  return DOMPurify.sanitize(cleaned, DOMPURIFY_OPTIONS);
}

/** True when HTML has no meaningful text content. */
export function isHtmlEmpty(html: string): boolean {
  const text = sanitizeArticleHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}
