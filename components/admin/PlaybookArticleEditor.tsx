"use client";

import { RichArticleEditor } from "@/components/admin/RichArticleEditor";

type PlaybookArticleEditorProps = {
  value: string;
  onChange: (value: string) => void;
  /** @deprecated kept for API compatibility, no longer used */
  textareaClassName?: string;
};

export function PlaybookArticleEditor({ value, onChange }: PlaybookArticleEditorProps) {
  return <RichArticleEditor value={value} onChange={onChange} />;
}
