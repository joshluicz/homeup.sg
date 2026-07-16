/**
 * Lightweight HTML helpers for serverless-safe pipeline routes.
 *
 * Do NOT import isomorphic-dompurify here — it has caused Vercel function 500s
 * when pulled into /api/admin/generate via article-sections.
 */

/** Strip scripts/styles and event handlers from pipeline-generated HTML. */
export function sanitizeArticleHtmlLite(html: string): string {
  if (!html?.trim()) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .trim();
}

/** True when HTML has no meaningful text content (no DOMPurify). */
export function isHtmlEmpty(html: string): boolean {
  if (!html?.trim()) return true;
  const text = sanitizeArticleHtmlLite(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

/** Alias used by article-sections — lite sanitization is enough for pipeline markdown → HTML. */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeArticleHtmlLite(html);
}
