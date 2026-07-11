"use client";

import DOMPurify from "isomorphic-dompurify";
import { normalizeHtmlArticle } from "@/lib/playbook/normalize-html-article";
import { trackWhatsAppClick } from "@/lib/analytics";

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
 * Convert Markdown GFM table syntax embedded in consecutive <p> elements into
 * real <table> HTML. This handles articles where the content was pasted from
 * Google Docs (or a Markdown editor) and the WYSIWYG editor wrapped each pipe
 * row in a <p> tag instead of producing a <table>.
 *
 * Recognises blocks of 2+ consecutive <p> elements whose text content (tags
 * stripped) starts and ends with | and contains at least 3 pipe characters.
 * The second row must be a GFM separator row (cells containing only -, : and
 * spaces) for the block to be treated as a table; otherwise the paragraphs are
 * left unchanged.
 */
function convertMarkdownTables(html: string): string {
  // Split into tokens — alternating [gap, <p>…</p>, gap, <p>…</p>, …]
  const tokens = html.split(/(<p(?:\s[^>]*)?>[\s\S]*?<\/p>)/i);
  const out: string[] = [];
  const buf: string[] = []; // buffered table-row <p> elements

  const flushBuf = () => {
    if (!buf.length) return;

    if (buf.length < 2) {
      out.push(...buf);
      buf.length = 0;
      return;
    }

    const rows = buf.map((p) => {
      const text = p.replace(/<[^>]+>/g, "").trim();
      return text
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
    });

    const isSepRow = (r: string[]) => r.every((c) => /^[-: ]+$/.test(c));

    if (rows.length >= 2 && isSepRow(rows[1])) {
      const head = rows[0].map((c) => `<th>${c}</th>`).join("");
      const body = rows
        .slice(2)
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
        .join("");
      out.push(
        `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
      );
    } else {
      out.push(...buf); // not a valid GFM table — leave as-is
    }

    buf.length = 0;
  };

  for (const tok of tokens) {
    if (!tok) continue;

    const isP = /^<p(?:\s[^>]*)?>/.test(tok);

    if (isP) {
      const text = tok.replace(/<[^>]+>/g, "").trim();
      const pipeCount = (text.match(/\|/g) ?? []).length;
      const isTableRow = text.startsWith("|") && text.endsWith("|") && pipeCount >= 3;

      if (isTableRow) {
        buf.push(tok);
      } else {
        flushBuf();
        out.push(tok);
      }
    } else {
      if (buf.length > 0 && !tok.trim()) {
        // Whitespace-only gap between table-row paragraphs — swallow it
      } else {
        flushBuf();
        out.push(tok);
      }
    }
  }

  flushBuf();
  return out.join("");
}

/**
 * Wrap bare <table> elements in a scroll container to match the Markdown renderer.
 * Uses a lookahead so it matches both <table> and <table ...attributes...>.
 */
function wrapTables(html: string): string {
  return html
    .replace(/<table(?=[\s>])/gi, '<div class="table-wrapper"><table')
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

  // 3. Convert Markdown syntax that got saved as plain text inside <p> elements
  //    (## headings, ![images](url), **bold** / *italic*)
  const mdNormalised = normalizeHtmlArticle(sectioned);

  // 4. Convert Markdown pipe-table syntax in <p> elements to real <table> HTML
  const withRealTables = convertMarkdownTables(mdNormalised);

  // 5. Wrap Quick Answer / HomeUp sections in card containers
  const withBoxes = wrapSectionBoxes(withRealTables);

  // 6. Wrap tables in scroll containers
  const withWrappedTables = wrapTables(withBoxes);

  // 7. Sanitise with DOMPurify
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
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel", "style", "class", "loading"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
    ADD_ATTR: ["target"],
  });

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
