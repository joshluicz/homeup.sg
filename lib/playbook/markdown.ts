/**
 * Turn plain-text or lightly formatted playbook articles into readable Markdown
 * with clear paragraph and heading breaks before render.
 */
export function normalizePlaybookMarkdown(raw: string): string {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  let normalized = text.replace(/\n{3,}/g, "\n\n");
  normalized = normalized.replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");

  const blockCount = normalized.split(/\n\n+/).filter(Boolean).length;
  const lineCount = normalized.split("\n").filter((l) => l.trim()).length;

  // Already has paragraph breaks — keep structure, only tidy spacing.
  if (blockCount >= Math.max(3, Math.floor(lineCount / 3))) {
    return normalized;
  }

  const lines = normalized.split("\n").map((l) => l.trim());

  const blocks: string[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(listBuffer.join("\n"));
    listBuffer = [];
  };

  for (const line of lines) {
    if (!line) {
      flushList();
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      flushList();
      blocks.push(line);
      continue;
    }

    const isListItem = /^[-*•]\s/.test(line) || /^\d+\.\s/.test(line);
    if (isListItem) {
      listBuffer.push(line.replace(/^•\s/, "- "));
      continue;
    }

    flushList();

    if (isLikelyHeading(line)) {
      blocks.push(formatHeading(line));
      continue;
    }

    blocks.push(line);
  }

  flushList();
  return blocks.join("\n\n");
}

function isLikelyHeading(line: string): boolean {
  if (line.length > 100) return false;
  if (/^#{1,6}\s/.test(line)) return true;
  if (/^\d+\.\s/.test(line)) return false;

  const words = line.split(/\s+/).filter(Boolean).length;
  // ALL CAPS section titles from Word exports (e.g. "THE HYBRID METHOD")
  return words >= 2 && words <= 14 && line === line.toUpperCase() && /[A-Z]/.test(line);
}

function formatHeading(line: string): string {
  const cleaned = line.replace(/^#{1,6}\s*/, "").trim();
  if (cleaned === cleaned.toUpperCase()) {
    const titled = cleaned
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `## ${titled}`;
  }
  return `## ${cleaned}`;
}
