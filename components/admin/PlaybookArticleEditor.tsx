"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/** Required section labels. The article renderer keys off these exact strings. */
const FORMAT_GUIDE = `REQUIRED STRUCTURE — every article must follow this order:

  Quick Answer:          ← 2-4 sentence direct answer. Renders as a callout box.
  [blank line]
  [answer text]

  Introduction:          ← Who this is for and why it matters.
  [blank line]
  [intro text]

  ## Your Question Here?  ← Main sections. Must end with ? and start with capital.
  [body text, tables, lists, images]

  How HomeUp Approaches This:  ← Branded HomeUp section. Required.
  [blank line]
  [how HomeUp helps, include CTA link]

  Conclusion:            ← 2-3 paragraph wrap-up. Optional but recommended.
  [blank line]
  [conclusion text]

  FAQ:                   ← SEO FAQ. Format exactly as shown below.
  [blank line]
  Q: Question one? A: Answer one.
  Q: Question two? A: Answer two.

TIPS:
  • Images:   ![Alt text](https://url-to-image.png)
  • Tables:   | Column 1 | Column 2 |\\n|---|---|\\n| Cell | Cell |
  • Bold:     **bold text**
  • Italic:   *italic text*
  • Links:    [Link text](https://url)
  • DO NOT use colored text, custom fonts, or WYSIWYG formatting — plain Markdown only.`;

const TEMPLATE = `Quick Answer:

[2–4 sentences. Lead with the direct answer to the core question — loan tenure, ABSD, freehold vs 99-year, etc.]

Introduction:

[Who this is for, why it matters, and a brief HomeUP intro — e.g. "I'm Dennis, a fixed fee property agent with HomeUp in Singapore…"]

## How Does [First Key Question]?

[Short paragraphs. One idea per paragraph. Link to related guides where helpful.]

## How Does [Second Key Question]?

[Continue with clear, scannable sections — each question as its own heading line ending with ?]

How HomeUp Approaches This:

[How HomeUP helps with this specific situation. Include CTAs like [Book a planning call with HomeUp →](https://wa.me/6580877015) or links to /sell-hdb, /buy-condo, etc.]

Conclusion:

[Summarise the key takeaways in 2–3 short paragraphs. End with a planning-call CTA if relevant.]

FAQ:

Q: [Common question 1]? A: [Direct 1–3 sentence answer.]

Q: [Common question 2]? A: [Direct answer.]

Q: [Common question 3]? A: [Direct answer.]`;

type Props = {
  value: string;
  onChange: (value: string) => void;
  textareaClassName?: string;
};

export function PlaybookArticleEditor({ value, onChange, textareaClassName }: Props) {
  const [guideOpen, setGuideOpen] = useState(false);

  const isHtml = /^\s*</.test((value || "").trim());
  const missingQuickAnswer = value.trim() && !/^Quick Answer:/im.test(value);
  const missingHomeUp = value.trim() && !/^How HomeUp Approaches This:/im.test(value);

  return (
    <div className="space-y-2">
      {/* Format guide toggle */}
      <button
        type="button"
        onClick={() => setGuideOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-left text-xs font-semibold text-primary-700 hover:bg-primary-100"
      >
        <span>📋 Playbook article format guide — click to {guideOpen ? "hide" : "show"}</span>
        {guideOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {guideOpen && (
        <pre className="overflow-x-auto rounded-lg border border-primary-100 bg-primary-50 p-4 text-xs font-mono leading-relaxed text-primary-900 whitespace-pre-wrap">
          {FORMAT_GUIDE}
        </pre>
      )}

      {/* Validation warnings */}
      {isHtml && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          ⚠️ HTML detected. This article will not render correctly. Clear the content below and re-enter it using plain Markdown format. Use the format guide above.
        </div>
      )}
      {!isHtml && missingQuickAnswer && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          ⚠️ Missing <code className="font-mono">Quick Answer:</code> section — this article will not show the callout box.
        </div>
      )}
      {!isHtml && missingHomeUp && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          ⚠️ Missing <code className="font-mono">How HomeUp Approaches This:</code> section.
        </div>
      )}

      {/* Markdown textarea */}
      <textarea
        value={value || TEMPLATE}
        onChange={(e) => onChange(e.target.value)}
        rows={36}
        spellCheck
        placeholder="Paste or type your article in Markdown format…"
        className={
          textareaClassName ||
          "w-full rounded-lg border border-neutral-200 bg-white p-3 font-mono text-xs leading-relaxed text-neutral-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        }
      />
      <p className="text-xs font-normal text-neutral-400">
        Plain Markdown only — no HTML, no WYSIWYG. Use the format guide above to ensure the article renders correctly on the site.
      </p>
    </div>
  );
}
