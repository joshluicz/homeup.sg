/**
 * Pre-process an HTML article string before loading it into the WYSIWYG editor
 * or rendering it on the public page.
 *
 * Old articles were sometimes saved with Markdown syntax fragments inside
 * <p> elements (because the WYSIWYG editor loaded legacy Markdown content by
 * wrapping each line in <p> tags without converting the syntax first).
 *
 * This module exports one function used in both the editor (so admins see
 * correct formatting when they open an article) and the renderer (so readers
 * see correct formatting on the public page).
 */

/** Convert ## / ### heading syntax inside <p> elements to heading tags. */
function convertHeadings(html: string): string {
  return html.replace(
    /<p([^>]*)>\s*(#{1,6})\s+([\s\S]*?)\s*<\/p>/gi,
    (_m, attrs, hashes, content) => {
      const level = Math.min(hashes.length, 6);
      return `<h${level}${attrs}>${content}</h${level}>`;
    },
  );
}

/** Convert ![alt](url) Markdown images to <img> tags. */
function convertImages(html: string): string {
  return html.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^)\s"]+)\)/g,
    (_m, alt, src) =>
      `<img src="${src}" alt="${alt || "Article illustration"}" loading="lazy">`,
  );
}

/** Convert **bold** and *italic* Markdown inside <p> elements to HTML tags. */
function convertEmphasis(html: string): string {
  return html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (_m, attrs, inner) => {
    let out = inner.replace(/\*\*([^*<>\n]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(?<!\*)\*([^*<>\n]+)\*(?!\*)/g, "<em>$1</em>");
    return `<p${attrs}>${out}</p>`;
  });
}

/**
 * Normalise an HTML article string:
 * - Convert Markdown headings / images / emphasis that ended up as plain text
 *
 * Safe to call multiple times (idempotent for already-clean HTML).
 */
export function normalizeHtmlArticle(html: string): string {
  if (!html?.trim()) return html;
  let out = convertHeadings(html);
  out = convertImages(out);
  out = convertEmphasis(out);
  return out;
}
