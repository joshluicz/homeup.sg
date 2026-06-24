/**
 * HomeUP playbook article structure:
 * Quick Answer → Introduction → question sections → How HomeUp → Conclusion → FAQ
 */

export type PlaybookArticleBlock =
  | { kind: "quick_answer"; body: string }
  | { kind: "introduction"; body: string }
  | { kind: "section"; title: string; body: string }
  | { kind: "homeup"; body: string }
  | { kind: "conclusion"; body: string }
  | { kind: "faq"; items: Array<{ q: string; a: string }> }
  | { kind: "content"; body: string };

const SECTION_LABELS = [
  "Quick Answer",
  "Introduction",
  "How HomeUp Approaches This",
  "Conclusion",
  "FAQ",
] as const;

const SECTION_SPLIT_RE = new RegExp(
  `(?=^(${SECTION_LABELS.map(escapeRegExp).join("|")}):\\s*$)`,
  "im",
);

export const PLAYBOOK_ARTICLE_TEMPLATE = `Quick Answer:

[2–4 sentences. Lead with the direct answer to the core question — loan tenure, ABSD, freehold vs 99-year, etc.]

Introduction:

[Who this is for, why it matters, and a brief HomeUP intro — e.g. "I'm Dennis, a fixed fee property agent with HomeUp in Singapore…"]

How Does [First Key Question]?

[Short paragraphs. One idea per paragraph. Link to related guides where helpful.]

How Does [Second Key Question]?

[Continue with clear, scannable sections — each question as its own heading line ending with ?]

How HomeUp Approaches This:

[How HomeUP helps with this specific situation. Include CTAs like [Book a planning call with HomeUp →](https://wa.me/6580877015) or links to /sell-hdb, /buy-condo, etc.]

Conclusion:

[Summarise the key takeaways in 2–3 short paragraphs. End with a planning-call CTA if relevant.]

FAQ:

Q: [Common question 1]? A: [Direct 1–3 sentence answer.]

Q: [Common question 2]? A: [Direct answer.]

Q: [Common question 3]? A: [Direct answer.]`;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip a leading section label line (plain, with colon, or markdown heading). */
function stripLeadingSectionLabel(body: string, label: string): string {
  const escaped = escapeRegExp(label);
  const patterns = [
    new RegExp(`^#{1,6}\\s+${escaped}:?\\s*(?:\\n|$)`, "i"),
    new RegExp(`^${escaped}:?\\s*(?:\\n|$)`, "i"),
  ];

  let text = body.trim();
  for (const pattern of patterns) {
    text = text.replace(pattern, "").trim();
  }
  return text;
}

/** Split quick-answer copy when Introduction was pasted inside the same section. */
function splitQuickAnswerBody(body: string): { qa: string; intro: string } {
  const qaBody = stripLeadingSectionLabel(body, "quick answer");
  const introMatch = qaBody.match(/(?:^|\n\n)(?:#{1,6}\s+)?Introduction:?\s*\n/i);
  if (!introMatch || introMatch.index === undefined) {
    return { qa: qaBody, intro: "" };
  }

  return {
    qa: qaBody.slice(0, introMatch.index).trim(),
    intro: qaBody.slice(introMatch.index + introMatch[0].length).trim(),
  };
}

function isSectionLabelOnly(text: string, label: string): boolean {
  return new RegExp(`^${escapeRegExp(label)}:?$`, "i").test(text.trim());
}

function isQuestionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || /^#{1,6}\s/.test(trimmed)) return false;
  if (/^Q:/i.test(trimmed)) return false;
  if (!trimmed.endsWith("?")) return false;
  if (trimmed.length < 15 || trimmed.length > 160) return false;
  return /^[A-Z"']/.test(trimmed);
}

/** Normalise spacing and promote question lines to markdown H2 headings. */
export function normalizeArticleFormat(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  for (const label of SECTION_LABELS) {
    const bareLine = new RegExp(`^(${escapeRegExp(label)})\\s*$`, "gim");
    text = text.replace(bareLine, "$1:");
    const inline = new RegExp(`^(${escapeRegExp(label)}):\\s+(.+)$`, "gim");
    text = text.replace(inline, "$1:\n\n$2");
    const bare = new RegExp(`^(${escapeRegExp(label)}):\\s*$`, "gim");
    text = text.replace(bare, "$1:\n");
  }

  const lines = text.split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    if (/^(Quick Answer|Introduction|How HomeUp Approaches This|Conclusion|FAQ):/i.test(trimmed)) {
      out.push(trimmed.replace(/\s+$/, ""));
      continue;
    }
    if (/^#{1,6}\s/.test(trimmed)) {
      out.push(trimmed);
      continue;
    }
    if (isQuestionHeading(trimmed)) {
      out.push(`## ${trimmed}`);
      continue;
    }
    out.push(line);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function parseInlineFaq(body: string): Array<{ q: string; a: string }> {
  const items: Array<{ q: string; a: string }> = [];
  const re = /Q:\s*([\s\S]+?)\s+A:\s*([\s\S]+?)(?=\s*Q:|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const q = match[1].trim();
    const a = match[2].trim();
    if (q && a) items.push({ q, a });
  }
  return items;
}

function splitIntroductionAndSections(body: string): PlaybookArticleBlock[] {
  const chunks = body.split(/^## /m);
  if (chunks.length === 1) {
    return body.trim() ? [{ kind: "introduction", body: body.trim() }] : [];
  }

  const blocks: PlaybookArticleBlock[] = [];
  const intro = chunks[0]?.trim();
  if (intro) blocks.push({ kind: "introduction", body: intro });

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i] ?? "";
    const newline = chunk.indexOf("\n");
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const sectionBody = (newline === -1 ? "" : chunk.slice(newline + 1)).trim();
    if (title) blocks.push({ kind: "section", title, body: sectionBody });
  }

  return blocks;
}

function labelToKind(label: string): PlaybookArticleBlock["kind"] | null {
  const normalized = label.trim().toLowerCase();
  if (normalized === "quick answer") return "quick_answer";
  if (normalized === "introduction") return "introduction";
  if (normalized === "how homeup approaches this") return "homeup";
  if (normalized === "conclusion") return "conclusion";
  if (normalized === "faq") return "faq";
  return null;
}

function parseLegacyMarkdownArticle(text: string): PlaybookArticleBlock[] {
  const normalized = normalizeArticleFormat(text);
  const parts = normalized.split(/^## /m);

  if (parts.length === 1) {
    const paragraphs = normalized.split(/\n\n+/).filter(Boolean);
    if (paragraphs.length >= 4) {
      const blocks: PlaybookArticleBlock[] = [
        { kind: "quick_answer", body: paragraphs[0] },
        { kind: "introduction", body: paragraphs[1] },
      ];

      for (let i = 2; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        const lines = paragraph.split("\n");
        const firstLine = lines[0]?.trim() ?? "";
        if (isQuestionHeading(firstLine)) {
          blocks.push({
            kind: "section",
            title: firstLine,
            body: lines.slice(1).join("\n").trim(),
          });
        } else if (/^how homeup approaches this$/i.test(firstLine.replace(/:$/, ""))) {
          blocks.push({ kind: "homeup", body: lines.slice(1).join("\n").trim() || paragraph });
        } else if (/^conclusion$/i.test(firstLine.replace(/:$/, ""))) {
          blocks.push({ kind: "conclusion", body: lines.slice(1).join("\n").trim() || paragraph });
        } else if (/^faq$/i.test(firstLine.replace(/:$/, ""))) {
          blocks.push({ kind: "faq", items: parseInlineFaq(lines.slice(1).join("\n") || paragraph) });
        } else {
          blocks.push({ kind: "section", title: firstLine, body: lines.slice(1).join("\n").trim() });
        }
      }

      return blocks;
    }

    return [{ kind: "content", body: normalized }];
  }

  const blocks: PlaybookArticleBlock[] = [];
  const preamble = parts[0]?.trim();

  if (preamble) {
    const preambleParts = preamble.split(/\n\n+/).filter(Boolean);
    let qaStart = 0;
    if (preambleParts[0] && isSectionLabelOnly(preambleParts[0], "Quick Answer")) {
      qaStart = 1;
    }

    if (preambleParts.length > qaStart + 1) {
      const qaBody = preambleParts.slice(qaStart, qaStart + 1).join("\n\n");
      const introBody = preambleParts.slice(qaStart + 1).join("\n\n");
      blocks.push({ kind: "quick_answer", body: stripLeadingSectionLabel(qaBody, "quick answer") });
      blocks.push({ kind: "introduction", body: stripLeadingSectionLabel(introBody, "introduction") });
    } else if (preambleParts.length > qaStart) {
      const { qa, intro } = splitQuickAnswerBody(preambleParts.slice(qaStart).join("\n\n"));
      if (qa) blocks.push({ kind: "quick_answer", body: qa });
      if (intro) blocks.push(...splitIntroductionAndSections(stripLeadingSectionLabel(intro, "introduction")));
    }
  }

  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i] ?? "";
    const newline = chunk.indexOf("\n");
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const body = (newline === -1 ? "" : chunk.slice(newline + 1)).trim();
    const titleKey = title.toLowerCase().replace(/:$/, "").trim();

    if (titleKey === "introduction") {
      blocks.push({ kind: "introduction", body });
    } else if (titleKey === "how homeup approaches this") {
      blocks.push({ kind: "homeup", body });
    } else if (titleKey === "conclusion") {
      blocks.push({ kind: "conclusion", body });
    } else if (titleKey === "faq") {
      blocks.push({ kind: "faq", items: parseInlineFaq(body) });
    } else if (titleKey === "quick answer") {
      blocks.push({ kind: "quick_answer", body });
    } else {
      blocks.push({ kind: "section", title, body });
    }
  }

  return blocks.length > 0 ? blocks : [{ kind: "content", body: normalized }];
}

export function parsePlaybookArticleBlocks(raw: string): PlaybookArticleBlock[] {
  const text = normalizeArticleFormat(raw);
  const hasStructuredLabels = SECTION_LABELS.some((label) =>
    new RegExp(`^${escapeRegExp(label)}:\\s*$`, "im").test(text),
  );

  if (!hasStructuredLabels) {
    return parseLegacyMarkdownArticle(text);
  }

  const parts = text.split(SECTION_SPLIT_RE).map((p) => p.trim()).filter(Boolean);
  const blocks: PlaybookArticleBlock[] = [];

  for (const part of parts) {
    const match = part.match(
      /^(Quick Answer|Introduction|How HomeUp Approaches This|Conclusion|FAQ):\s*\n([\s\S]*)$/i,
    );
    if (!match) continue;

    const kind = labelToKind(match[1]);
    const body = match[2].trim();
    if (!kind) continue;

    switch (kind) {
      case "quick_answer": {
        const { qa, intro } = splitQuickAnswerBody(body);
        if (qa) blocks.push({ kind: "quick_answer", body: qa });
        if (intro) {
          blocks.push(
            ...splitIntroductionAndSections(stripLeadingSectionLabel(intro, "introduction")),
          );
        }
        break;
      }
      case "introduction":
        blocks.push(
          ...splitIntroductionAndSections(stripLeadingSectionLabel(body, "introduction")),
        );
        break;
      case "homeup":
        blocks.push({ kind: "homeup", body });
        break;
      case "conclusion":
        blocks.push({ kind: "conclusion", body });
        break;
      case "faq":
        blocks.push({ kind: "faq", items: parseInlineFaq(body) });
        break;
      default:
        break;
    }
  }

  return blocks.length > 0 ? blocks : [{ kind: "content", body: text }];
}

export function articleHasInlineFaq(blocks: PlaybookArticleBlock[]): boolean {
  return blocks.some((block) => block.kind === "faq" && block.items.length > 0);
}
