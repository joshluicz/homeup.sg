/**
 * CEA terminology guardrails for HomeUP consumer-facing copy.
 *
 * HomeUP is marketed as a team of CEA-licensed property AGENTS.
 * Calling HomeUP an "agency" in marketing/article copy is a CEA compliance violation.
 * (C & H Properties is the licensed agency entity — legal footnotes only.)
 */

import type { ArticleSections } from "@/lib/playbook/article-sections";

export const CEA_TERMINOLOGY_GUIDANCE = `CEA TERMINOLOGY — HomeUP brand rules (mandatory):
- NEVER call HomeUp, HomeUP, or "we/our" an "agency", "estate agency", or "property agency" in consumer-facing copy.
- HomeUP is a brand/team of CEA-licensed property AGENTS operating under C & H Properties (CEA L3007139C).
- USE: "fixed-fee property agent", "CEA-licensed agent", "property advisor", "HomeUP team", "our agents".
- Example intro: "I'm Dennis Lim, a fixed-fee property agent with HomeUP in Singapore…"
- NOT: "fixed-fee agency", "HomeUP is a property agency", "our agency".`;

/** Context window (chars) when checking if "agency" refers to HomeUP. */
const HOMEUP_CONTEXT_RE = /\b(?:HomeUp|HomeUP|Homeup|homeup\.sg|fixed[- ]fee|CEA[- ]licensed|our team|our agents|I'm|I am)\b/i;

const PHRASE_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string; label: string }> = [
  {
    pattern: /\bfixed[- ]fee\s+agenc(?:y|ies)\b/gi,
    replacement: "fixed-fee property agent",
    label: "fixed-fee agency → fixed-fee property agent",
  },
  {
    pattern: /\bHomeUp(?:\.sg)?\s+is\s+(?:a|an)\s+(?:Singapore\s+)?(?:fixed[- ]fee\s+)?(?:property\s+)?agenc(?:y|ies)\b/gi,
    replacement: "HomeUp is a team of fixed-fee property agents",
    label: "HomeUp is an agency → team of agents",
  },
  {
    pattern: /\bHomeUP\s+is\s+(?:a|an)\s+(?:Singapore\s+)?(?:fixed[- ]fee\s+)?(?:property\s+)?agenc(?:y|ies)\b/gi,
    replacement: "HomeUP is a team of fixed-fee property agents",
    label: "HomeUP is an agency → team of agents",
  },
  {
    pattern: /\b(?:with|from|at)\s+HomeUp(?:\.sg)?,?\s+(?:a|an)\s+fixed[- ]fee\s+agenc(?:y|ies)\b/gi,
    replacement: "with HomeUp, a fixed-fee property agent team",
    label: "with HomeUp, a fixed-fee agency",
  },
  {
    pattern: /\b(?:with|from|at)\s+HomeUP,?\s+(?:a|an)\s+fixed[- ]fee\s+agenc(?:y|ies)\b/gi,
    replacement: "with HomeUP, a fixed-fee property agent team",
    label: "with HomeUP, a fixed-fee agency",
  },
  {
    pattern: /\b(?:our|the)\s+agenc(?:y|ies)\b/gi,
    replacement: "our team",
    label: "our/the agency → our team",
  },
];

function nearHomeUpContext(text: string, index: number, window = 120): boolean {
  const start = Math.max(0, index - window);
  const end = Math.min(text.length, index + window);
  return HOMEUP_CONTEXT_RE.test(text.slice(start, end));
}

/** Returns human-readable violations still present after sanitization would run. */
export function detectAgencyTerminologyViolations(text: string): string[] {
  const issues: string[] = [];

  for (const { pattern, label } of PHRASE_REPLACEMENTS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      issues.push(`CEA terminology: ${label}`);
    }
  }

  const agencyRe = /\bagenc(?:y|ies)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = agencyRe.exec(text)) !== null) {
    if (nearHomeUpContext(text, match.index)) {
      const snippet = text.slice(Math.max(0, match.index - 40), match.index + 40).replace(/\s+/g, " ");
      issues.push(`CEA terminology: "agency" near HomeUP context — "...${snippet}..."`);
    }
  }

  return [...new Set(issues)];
}

/** Deterministic fixes — last line of defence before publish. */
export function sanitizeAgencyTerminology(text: string): { text: string; fixes: string[] } {
  let result = text;
  const fixes: string[] = [];

  for (const { pattern, replacement, label } of PHRASE_REPLACEMENTS) {
    if (pattern.test(result)) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, replacement);
      fixes.push(label);
    }
    pattern.lastIndex = 0;
  }

  // Residual "property agency" only when clearly about HomeUP / fixed-fee positioning
  const propertyAgencyRe = /\bproperty\s+agenc(?:y|ies)\b/gi;
  result = result.replace(propertyAgencyRe, (match, offset) => {
    if (nearHomeUpContext(result, offset)) {
      fixes.push("property agency → property agent (HomeUP context)");
      return match.toLowerCase().startsWith("property agenc") ? "property agent" : "property agents";
    }
    return match;
  });

  return { text: result, fixes: [...new Set(fixes)] };
}

export function sanitizeDraftFields<T extends { article: string; faq?: { q: string; a: string }[]; description?: string; metaDescription?: string }>(
  draft: T,
): T & { terminologyFixes: string[] } {
  const fixes: string[] = [];
  const { text: article, fixes: articleFixes } = sanitizeAgencyTerminology(draft.article);
  fixes.push(...articleFixes);

  let description = draft.description;
  if (description) {
    const d = sanitizeAgencyTerminology(description);
    description = d.text;
    fixes.push(...d.fixes);
  }

  let metaDescription = draft.metaDescription;
  if (metaDescription) {
    const m = sanitizeAgencyTerminology(metaDescription);
    metaDescription = m.text;
    fixes.push(...m.fixes);
  }

  const faq = (draft.faq ?? []).map((item) => {
    const q = sanitizeAgencyTerminology(item.q);
    const a = sanitizeAgencyTerminology(item.a);
    fixes.push(...q.fixes, ...a.fixes);
    return { q: q.text, a: a.text };
  });

  return {
    ...draft,
    article,
    description,
    metaDescription,
    faq,
    terminologyFixes: [...new Set(fixes)],
  };
}

/** Sanitize structured article section HTML/text fields before admin publish. */
export function sanitizeArticleSectionsFields(sections: ArticleSections): ArticleSections {
  const clean = (value: string) => sanitizeAgencyTerminology(value).text;
  return {
    ...sections,
    quickAnswer: clean(sections.quickAnswer),
    introduction: clean(sections.introduction),
    homeup: clean(sections.homeup),
    conclusion: clean(sections.conclusion),
    sections: sections.sections.map((entry) => ({
      ...entry,
      title: clean(entry.title),
      body: clean(entry.body),
    })),
  };
}
