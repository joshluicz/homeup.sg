"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Upload } from "lucide-react";
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

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/") && !file.type.includes("heic") && !file.type.includes("heif")) {
    return true;
  }
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
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
  const [success, setSuccess] = useState<string | null>(null);
  const [lastPreview, setLastPreview] = useState<string | null>(null);
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
    const file = Array.from(files ?? []).find(isImageFile);
    if (!file) {
      const hadHeic = Array.from(files ?? []).some((f) => /\.heic$|\.heif$/i.test(f.name));
      setError(
        hadHeic
          ? "iPhone HEIC photos are not supported yet. In Photos, share the image as JPG or PNG, then upload again."
          : "Please choose a JPG, PNG, or WebP photo.",
      );
      setSuccess(null);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = await uploadPlaybookArticleImage(file);
      insertAtCursor(buildImageMarkdown(url, caption));
      setLastPreview(url);
      setCaption("");
      setSuccess("Photo added to the article. Scroll the text box to see it, then click Save changes at the bottom.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Image upload failed. Please try again.",
      );
      setLastPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Add photos
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-neutral-600">
          <li>Click in the article text where you want the photo.</li>
          <li>Click <strong>Choose photo</strong> (or drag a file into the box below).</li>
          <li>Click <strong>Save changes</strong> at the bottom of the page.</li>
        </ol>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption under the photo (optional)"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:flex-1"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Choose photo
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
          Or drag and drop a photo here
        </div>

        {success && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {lastPreview && (
          <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white p-2">
            <p className="mb-2 text-xs font-semibold text-neutral-500">Preview of last photo added</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lastPreview} alt="" className="max-h-48 w-full rounded-md object-contain" />
          </div>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        placeholder={
          "## Heading\n\nWrite the full guide here. Use Choose photo above to add images — you do not need to type any special code."
        }
        className={textareaClassName}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
