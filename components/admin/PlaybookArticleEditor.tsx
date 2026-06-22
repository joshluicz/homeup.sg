"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { uploadPlaybookArticleImage } from "@/lib/playbook/storage";
import { cn } from "@/lib/utils";

type PlaybookArticleEditorProps = {
  value: string;
  onChange: (value: string) => void;
  textareaClassName?: string;
};

function buildImageMarkdown(url: string, alt: string): string {
  const caption = alt.trim() || "Article illustration";
  return `![${caption}](${url})`;
}

export function PlaybookArticleEditor({
  value,
  onChange,
  textareaClassName,
}: PlaybookArticleEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      const spacer = value.trim() ? (value.endsWith("\n\n") ? "" : "\n\n") : "";
      onChange(`${value}${spacer}${snippet}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);

    let prefix = "";
    if (before.length > 0) {
      prefix = before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    }

    let suffix = "";
    if (after.length > 0) {
      suffix = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    }

    const next = `${before}${prefix}${snippet}${suffix}${after}`;
    onChange(next);

    requestAnimationFrame(() => {
      el.focus();
      const pos = before.length + prefix.length + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function handleFiles(files: FileList | File[] | null) {
    const file = Array.from(files ?? []).find((f) => f.type.startsWith("image/"));
    if (!file) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const url = await uploadPlaybookArticleImage(file);
      insertAtCursor(buildImageMarkdown(url, caption));
      setCaption("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Images
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Upload a photo to insert it into the article at your cursor. Great for diagrams, screenshots, or property examples.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:flex-1"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Insert image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-sm transition-colors",
            dragging
              ? "border-primary-400 bg-primary-50 text-primary-700"
              : "border-neutral-300 bg-white text-neutral-500",
          )}
        >
          <Upload className="h-4 w-4 shrink-0" />
          Or drag and drop an image here
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        placeholder={
          "## Heading\n\nWrite the full guide here. Supports Markdown: ## headings, **bold**, - lists, [links](url), and images via Insert image above."
        }
        className={textareaClassName}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-neutral-400">
        Markdown tip: images use <code className="rounded bg-neutral-100 px-1">![caption](url)</code>. You can also paste image URLs manually.
      </p>
    </div>
  );
}
