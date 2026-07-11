"use client";

import { RichArticleEditor } from "@/components/admin/RichArticleEditor";

type SectionRichEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
};

/** Compact rich-text editor for a single structured article section field. */
export function SectionRichEditor({
  value,
  onChange,
  placeholder,
  minHeight = "160px",
}: SectionRichEditorProps) {
  return (
    <RichArticleEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight={minHeight}
      compact
      showSectionMenu={false}
      showTables
    />
  );
}
