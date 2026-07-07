/** Returns true when the content was produced by the WYSIWYG editor (HTML) rather than plain markdown. */
export function isHtmlContent(content: string): boolean {
  return /^\s*</.test(content.trim());
}
