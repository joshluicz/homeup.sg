/**
 * Convert Markdown GFM pipe tables embedded in HTML into real <table> elements.
 * Handles WYSIWYG saves where each row became its own <p>, including empty <p></p> gaps.
 */

function escapeCell(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowsToTableHtml(rows: string[][]): string {
  const head = rows[0].map((c) => `<th>${escapeCell(c)}</th>`).join("");
  const body = rows
    .slice(2)
    .map((r) => `<tr>${r.map((c) => `<td>${escapeCell(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function parsePipeRows(lines: string[]): string[][] {
  return lines.map((line) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim()),
  );
}

function isSeparatorRow(row: string[]): boolean {
  return row.every((c) => /^[-: ]+$/.test(c));
}

/** Convert a plain-text GFM table block to HTML, or null if not a valid table. */
function markdownTableTextToHtml(text: string): string | null {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2 || !lines[0].startsWith("|")) return null;

  const rows = parsePipeRows(lines);
  if (rows.length < 2 || !isSeparatorRow(rows[1])) return null;

  return rowsToTableHtml(rows);
}

/** Convert tables that live inside a single <p> (newlines or <br> between rows). */
function convertSingleParagraphMarkdownTables(html: string): string {
  return html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, _attrs, inner) => {
    const text = inner
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!text.includes("|") || !text.startsWith("|")) return match;

    const tableHtml = markdownTableTextToHtml(text);
    return tableHtml ?? match;
  });
}

/**
 * Convert consecutive <p>| … |</p> elements into a <table>.
 */
export function convertMarkdownTablesInHtml(html: string): string {
  let out = convertSingleParagraphMarkdownTables(html);

  const tokens = out.split(/(<p(?:\s[^>]*)?>[\s\S]*?<\/p>)/i);
  const parts: string[] = [];
  const buf: string[] = [];

  const flushBuf = () => {
    if (!buf.length) return;

    if (buf.length < 2) {
      parts.push(...buf);
      buf.length = 0;
      return;
    }

    const rows = buf.map((p) => {
      const text = p.replace(/<[^>]+>/g, "").trim();
      return parsePipeRows([text])[0] ?? [];
    });

    if (rows.length >= 2 && isSeparatorRow(rows[1]!)) {
      parts.push(rowsToTableHtml(rows));
    } else {
      parts.push(...buf);
    }

    buf.length = 0;
  };

  for (const tok of tokens) {
    if (!tok) continue;

    const isP = /^<p(?:\s[^>]*)?>/.test(tok);

    if (isP) {
      const text = tok.replace(/<[^>]+>/g, "").trim();

      if (!text) {
        // Empty <p></p> between table rows — ignore while buffering
        if (buf.length > 0) continue;
        parts.push(tok);
        continue;
      }

      const pipeCount = (text.match(/\|/g) ?? []).length;
      const isTableRow = text.startsWith("|") && text.endsWith("|") && pipeCount >= 3;

      if (isTableRow) {
        buf.push(tok);
      } else {
        flushBuf();
        parts.push(tok);
      }
    } else {
      if (buf.length > 0 && !tok.trim()) {
        // whitespace gap between table rows
      } else {
        flushBuf();
        parts.push(tok);
      }
    }
  }

  flushBuf();
  return parts.join("");
}

/** Wrap bare <table> elements in a scroll container. */
export function wrapHtmlTables(html: string): string {
  return html
    .replace(/<table(?=[\s>])/gi, '<div class="table-wrapper"><table')
    .replace(/<\/table>/gi, "</table></div>");
}

/** Full pipeline for section HTML snippets before DOMPurify. */
export function prepareSectionHtml(html: string): string {
  return wrapHtmlTables(convertMarkdownTablesInHtml(html));
}
