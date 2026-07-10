"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const SECTIONS = [
  {
    icon: "💬",
    label: "Quick Answer",
    required: true,
    tip: 'Write 2–4 sentences that directly answer the main question. Then select that text and click the quote icon (❝) in the toolbar to turn it into a highlighted green callout box.',
  },
  {
    icon: "📖",
    label: "Introduction",
    required: false,
    tip: "Who is this article for? Why should they keep reading? A short paragraph is enough.",
  },
  {
    icon: "📌",
    label: "Main Sections",
    required: true,
    tip: 'Use Heading 2 (H2) from the toolbar dropdown for each main topic. Add as many sections as you like — aim for 3–5.',
  },
  {
    icon: "🏠",
    label: "How HomeUp Approaches This",
    required: true,
    tip: "Explain how HomeUp can help the reader. Include a link to your WhatsApp or a booking page.",
  },
  {
    icon: "✅",
    label: "Conclusion",
    required: false,
    tip: "Wrap up the key points in 2–3 sentences. Optional but recommended.",
  },
];

const TIPS = [
  { icon: "B", label: "Bold text", desc: "Select text → click B in the toolbar" },
  { icon: "🖼", label: "Add a photo", desc: "Click the image icon in the toolbar, or drag a photo straight into the editor" },
  { icon: "⊞", label: "Add a table", desc: "Click the table icon in the toolbar" },
  { icon: "🔗", label: "Add a link", desc: "Select text → click the link icon → paste your URL" },
  { icon: "H2", label: "Section heading", desc: "Click the text-style dropdown (top left) → choose Heading 2" },
];

export function ArticleFormatGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-primary-800">
          📋 Article structure guide
          <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">
            Quick reference
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-primary-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-primary-600" />
        )}
      </button>

      {open && (
        <div className="border-t border-primary-200 px-4 pb-4 pt-3 space-y-4">
          {/* Google Docs paste notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-800">
              📋 Pasting from Google Docs?
            </p>
            <p className="mt-0.5 text-xs font-normal leading-relaxed text-amber-700">
              Font and size overrides are automatically removed on paste so your article always uses the HomeUP brand font. After pasting, use the H2 heading button in the toolbar to create section headings — do not rely on Google Docs heading styles.
            </p>
          </div>

          {/* Section structure */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
              Article sections — in order
            </p>
            <div className="space-y-2">
              {SECTIONS.map((s) => (
                <div
                  key={s.label}
                  className="flex gap-3 rounded-lg border border-primary-100 bg-white px-3 py-2.5"
                >
                  <span className="shrink-0 text-base">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {s.label}
                      {s.required && (
                        <span className="ml-1.5 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">
                          Required
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs font-normal leading-relaxed text-neutral-500">
                      {s.tip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor tips */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
              Quick editor tips
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TIPS.map((t) => (
                <div
                  key={t.label}
                  className="flex items-start gap-2.5 rounded-lg border border-primary-100 bg-white px-3 py-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 text-[10px] font-bold text-neutral-700">
                    {t.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-neutral-800">{t.label}</p>
                    <p className="text-xs font-normal text-neutral-500">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs font-normal text-primary-700">
            💡 <strong>Tip:</strong> When you&apos;re happy with your article, click{" "}
            <strong>Save changes</strong> at the bottom — the article goes live on the website right away.
          </p>
        </div>
      )}
    </div>
  );
}
