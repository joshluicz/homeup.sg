"use client";

import type { ArticleSections, FaqEntry } from "@/lib/playbook/article-sections";
import { createSectionId } from "@/lib/playbook/article-sections";
import { SectionRichEditor } from "@/components/admin/SectionRichEditor";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label className="block text-sm font-semibold text-neutral-900">
        {children}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs font-normal text-neutral-500">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

type StructuredArticleEditorProps = {
  sections: ArticleSections;
  faq: FaqEntry[];
  onSectionsChange: (sections: ArticleSections) => void;
  onFaqChange: (faq: FaqEntry[]) => void;
  validationErrors?: string[];
};

export function StructuredArticleEditor({
  sections,
  faq,
  onSectionsChange,
  onFaqChange,
  validationErrors = [],
}: StructuredArticleEditorProps) {
  function updateSection<K extends keyof ArticleSections>(key: K, value: ArticleSections[K]) {
    onSectionsChange({ ...sections, [key]: value });
  }

  function updateBodySection(index: number, patch: Partial<ArticleSections["sections"][number]>) {
    const next = sections.sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    updateSection("sections", next);
  }

  function addBodySection() {
    updateSection("sections", [
      ...sections.sections,
      { id: createSectionId(), title: "", body: "" },
    ]);
  }

  function removeBodySection(index: number) {
    updateSection(
      "sections",
      sections.sections.filter((_, i) => i !== index),
    );
  }

  function setFaqItem(index: number, key: keyof FaqEntry, value: string) {
    onFaqChange(faq.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function addFaqItem() {
    onFaqChange([...faq, { q: "", a: "" }]);
  }

  function removeFaqItem(index: number) {
    onFaqChange(faq.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-800">Please fix the following before saving:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-xl border border-primary-200 bg-primary-50/30 p-4">
        <FieldLabel required hint="2–4 sentences. Shown in the green callout box at the top of the article.">
          Quick Answer
        </FieldLabel>
        <SectionRichEditor
          value={sections.quickAnswer}
          onChange={(quickAnswer) => updateSection("quickAnswer", quickAnswer)}
          placeholder="Lead with the direct answer to the reader's main question…"
          minHeight="120px"
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <FieldLabel required hint="Who this is for, why it matters, and a brief intro.">
          Introduction
        </FieldLabel>
        <SectionRichEditor
          value={sections.introduction}
          onChange={(introduction) => updateSection("introduction", introduction)}
          placeholder="Introduce the topic and who this guide is for…"
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <FieldLabel hint="Each question becomes an H2 section on the published page.">
            Question sections
          </FieldLabel>
          <button
            type="button"
            onClick={addBodySection}
            className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Add section
          </button>
        </div>

        {sections.sections.length === 0 && (
          <p className="text-xs text-neutral-400">
            Add at least one question section (e.g. &quot;How does ABSD work for upgraders?&quot;).
          </p>
        )}

        <div className="space-y-4">
          {sections.sections.map((section, index) => (
            <div key={section.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600">Section {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeBodySection(index)}
                  aria-label="Remove section"
                  className="text-neutral-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateBodySection(index, { title: e.target.value })}
                placeholder="Section heading — must end with ?"
                className={cn(inputClass, "mb-2 font-medium")}
              />
              <SectionRichEditor
                value={section.body}
                onChange={(body) => updateBodySection(index, { body })}
                placeholder="Answer this question in short paragraphs…"
                minHeight="140px"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <FieldLabel required hint="How HomeUp helps with this situation. Include CTAs and links where relevant.">
          How HomeUp Approaches This
        </FieldLabel>
        <SectionRichEditor
          value={sections.homeup}
          onChange={(homeup) => updateSection("homeup", homeup)}
          placeholder="Explain how HomeUp helps and include a planning-call CTA…"
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <FieldLabel required hint="Summarise key takeaways in 2–3 short paragraphs.">
          Conclusion
        </FieldLabel>
        <SectionRichEditor
          value={sections.conclusion}
          onChange={(conclusion) => updateSection("conclusion", conclusion)}
          placeholder="Wrap up with the main takeaways…"
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <FieldLabel required hint="Shown as an accordion on the published page. Also used for FAQ schema (SEO).">
            FAQ
          </FieldLabel>
          <button
            type="button"
            onClick={addFaqItem}
            className="text-xs font-bold text-primary-600 hover:underline"
          >
            + Add question
          </button>
        </div>

        {faq.length === 0 && (
          <p className="text-xs text-neutral-400">Add at least one question and answer pair.</p>
        )}

        <div className="space-y-3">
          {faq.map((item, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600">Question {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFaqItem(i)}
                  aria-label="Remove question"
                  className="text-neutral-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.q}
                onChange={(e) => setFaqItem(i, "q", e.target.value)}
                placeholder="Question"
                className={cn(inputClass, "mb-2")}
              />
              <textarea
                value={item.a}
                onChange={(e) => setFaqItem(i, "a", e.target.value)}
                rows={2}
                placeholder="Answer (1–3 sentences)"
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
