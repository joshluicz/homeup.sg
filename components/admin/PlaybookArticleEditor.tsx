"use client";

import dynamic from "next/dynamic";

// TipTap uses browser-only APIs — load with no SSR to prevent hydration errors.
const RichArticleEditor = dynamic(
  () => import("@/components/admin/RichArticleEditor").then((m) => m.RichArticleEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[480px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
        Loading editor…
      </div>
    ),
  },
);

type PlaybookArticleEditorProps = {
  value: string;
  onChange: (value: string) => void;
  /** @deprecated kept for API compatibility, no longer used */
  textareaClassName?: string;
};

export function PlaybookArticleEditor({ value, onChange }: PlaybookArticleEditorProps) {
  return <RichArticleEditor value={value} onChange={onChange} />;
}
