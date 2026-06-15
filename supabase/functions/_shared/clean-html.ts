import { MAX_HTML_CHARS } from "./types.ts";

export function cleanHtml(raw: string): string {
  let html = raw;

  // Remove comments
  html = html.replace(/<!--[\s\S]*?-->/g, " ");

  // Remove script, style, nav, footer, svg blocks
  html = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, " ");
  html = html.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  html = html.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  html = html.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  // Remove common PG chrome sections
  html = html.replace(/<header[\s\S]*?<\/header>/gi, " ");
  html = html.replace(/<aside[\s\S]*?<\/aside>/gi, " ");
  html = html.replace(/class="[^"]*cookie[^"]*"[\s\S]*?<\/div>/gi, " ");
  html = html.replace(/class="[^"]*related-listing[^"]*"[\s\S]*?<\/section>/gi, " ");

  // Collapse whitespace
  html = html.replace(/\s+/g, " ").trim();

  if (html.length > MAX_HTML_CHARS) {
    html = html.slice(0, MAX_HTML_CHARS);
  }

  return html;
}
