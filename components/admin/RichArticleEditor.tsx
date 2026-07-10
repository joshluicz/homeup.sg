"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Quote,
  Undo,
  Redo,
  Loader2,
  Check,
  Upload,
  ChevronDown,
  Table as TableIcon,
} from "lucide-react";
import { uploadPlaybookArticleImage } from "@/lib/playbook/storage";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type RichArticleEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|svg|ico|tiff?|heic|heif|avif)$/i.test(file.name);
}

/** Detect whether a string is HTML or plain Markdown. */
export { isHtmlContent } from "@/lib/playbook/is-html-content";
import { isHtmlContent } from "@/lib/playbook/is-html-content";
import { normalizeHtmlArticle } from "@/lib/playbook/normalize-html-article";

/**
 * Prepare article content for loading into the editor.
 * HTML articles get Markdown-syntax fragments converted to proper HTML so
 * editors see the correct visual layout. Plain Markdown is wrapped in <p>
 * tags as before.
 */
function prepareEditorContent(value: string): string {
  if (isHtmlContent(value)) return normalizeHtmlArticle(value);
  return `<p>${value.replace(/\n/g, "</p><p>") || ""}</p>`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-neutral-200" />;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active
          ? "bg-neutral-200 text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function HeadingSelect({ editor }: { editor: Editor }) {
  const options = [
    { label: "Normal text", value: "paragraph" },
    { label: "Heading 1", value: "h1" },
    { label: "Heading 2", value: "h2" },
    { label: "Heading 3", value: "h3" },
  ] as const;

  const current =
    editor.isActive("heading", { level: 1 })
      ? "h1"
      : editor.isActive("heading", { level: 2 })
        ? "h2"
        : editor.isActive("heading", { level: 3 })
          ? "h3"
          : "paragraph";

  return (
    <div className="relative">
      <select
        value={current}
        title="Text style"
        onChange={(e) => {
          const val = e.target.value;
          if (val === "paragraph") editor.chain().focus().setParagraph().run();
          else if (val === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
          else if (val === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
          else if (val === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
        }}
        className="h-7 cursor-pointer appearance-none rounded border border-neutral-200 bg-white pl-2 pr-6 text-xs font-medium text-neutral-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}

/**
 * FontFamily is intentionally NOT exposed in the toolbar.
 * All articles must use the brand font (Plus Jakarta Sans).
 * The FontFamily extension is still loaded so that TipTap can round-trip
 * existing content that may contain font-family marks, but editors cannot
 * apply new font overrides — and pasted font-family styles are stripped
 * automatically via transformPastedHTML below.
 */

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Black", value: "#111111" },
  { label: "Dark grey", value: "#444444" },
  { label: "Grey", value: "#888888" },
  { label: "Red", value: "#e53e3e" },
  { label: "Orange", value: "#dd6b20" },
  { label: "Green", value: "#276749" },
  { label: "Blue", value: "#2b6cb0" },
  { label: "Purple", value: "#553c9a" },
] as const;

function ColorSelect({ editor }: { editor: Editor }) {
  const activeColor =
    TEXT_COLORS.find((c) => c.value && editor.isActive("textStyle", { color: c.value }))?.value ??
    "";

  return (
    <div className="relative flex items-center">
      <select
        value={activeColor}
        title="Text colour"
        onChange={(e) => {
          const val = e.target.value;
          if (!val) editor.chain().focus().unsetColor().run();
          else editor.chain().focus().setColor(val).run();
        }}
        className="h-7 cursor-pointer appearance-none rounded border border-neutral-200 bg-white pl-2 pr-6 text-xs font-medium text-neutral-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100"
        style={{ color: activeColor || undefined }}
      >
        {TEXT_COLORS.map((c) => (
          <option key={c.value} value={c.value} style={{ color: c.value || undefined }}>
            {c.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}

function LinkDialog({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function apply() {
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url.trim(), target: "_blank" }).run();
    }
    setOpen(false);
    setUrl("");
  }

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
          } else {
            setUrl(editor.getAttributes("link").href ?? "");
            setOpen(true);
          }
        }}
        active={editor.isActive("link")}
        title="Link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      {open && (
        <div className="absolute left-0 top-9 z-50 flex w-72 flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
          <p className="text-xs font-semibold text-neutral-700">Insert link</p>
          <input
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply();
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="https://example.com"
            className="rounded border border-neutral-200 px-2 py-1.5 text-xs outline-none focus:border-primary-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={apply}
              className="flex-1 rounded bg-primary-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded border border-neutral-200 px-2 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({
  editor,
  onImageUpload,
  uploading,
}: {
  editor: Editor;
  onImageUpload: () => void;
  uploading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <HeadingSelect editor={editor} />
      <ColorSelect editor={editor} />

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align centre"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Align right"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        active={editor.isActive({ textAlign: "justify" })}
        title="Justify"
      >
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Callout box"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal divider"
      >
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <LinkDialog editor={editor} />

      <ToolbarButton onClick={onImageUpload} disabled={uploading} title="Insert image">
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5" />
        )}
      </ToolbarButton>

      <ToolbarDivider />

      {/* Section labels */}
      <InsertSectionMenu editor={editor} />

      <ToolbarDivider />

      {/* Table */}
      <TableMenu editor={editor} />
    </div>
  );
}

// ─── Section label insert menu ───────────────────────────────────────────────

const ARTICLE_SECTION_LABELS = [
  { label: "Quick Answer", desc: "Green callout box — required" },
  { label: "Introduction", desc: "Opening paragraph" },
  { label: "How HomeUp Approaches This", desc: "Neutral info box — required" },
  { label: "Conclusion", desc: "Closing paragraph" },
  { label: "FAQ", desc: "Frequently asked questions" },
] as const;

function InsertSectionMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);

  function insertSection(label: string) {
    editor
      .chain()
      .focus()
      .insertContent([
        { type: "paragraph", content: [{ type: "text", text: label }] },
        { type: "paragraph" },
      ])
      .run();
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        title="Insert section label (Quick Answer, Introduction, etc.)"
        className="flex h-7 items-center gap-1 rounded border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
      >
        § Section
        <ChevronDown className="h-3 w-3 text-neutral-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 min-w-[230px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
            Insert section label
          </p>
          {ARTICLE_SECTION_LABELS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-left hover:bg-neutral-50"
              onMouseDown={(e) => {
                e.preventDefault();
                insertSection(s.label);
              }}
            >
              <span className="text-xs font-semibold text-neutral-800">{s.label}</span>
              <span className="text-[11px] text-neutral-400">{s.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Table menu ──────────────────────────────────────────────────────────────

function TableMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const inTable = editor.isActive("table");

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setOpen((v) => !v)}
        active={inTable}
        title="Table"
      >
        <TableIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      {open && (
        <div className="absolute left-0 top-9 z-50 min-w-[180px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {!inTable && (
            <button
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                setOpen(false);
              }}
            >
              Insert table (3×3)
            </button>
          )}
          {inTable && (
            <>
              <button type="button" className="flex w-full items-center px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); setOpen(false); }}>
                Add column after
              </button>
              <button type="button" className="flex w-full items-center px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); setOpen(false); }}>
                Add column before
              </button>
              <button type="button" className="flex w-full items-center px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); setOpen(false); }}>
                Delete column
              </button>
              <hr className="my-1 border-neutral-100" />
              <button type="button" className="flex w-full items-center px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); setOpen(false); }}>
                Add row after
              </button>
              <button type="button" className="flex w-full items-center px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); setOpen(false); }}>
                Add row before
              </button>
              <button type="button" className="flex w-full items-center px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); setOpen(false); }}>
                Delete row
              </button>
              <hr className="my-1 border-neutral-100" />
              <button type="button" className="flex w-full items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); setOpen(false); }}>
                Delete table
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

export function RichArticleEditor({ value, onChange }: RichArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const [uploadStatus, setUploadStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  // Prevent onChange → setContent → onChange feedback loop
  const internalChange = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      TiptapImage.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder:
          "Start writing your article here… Use the toolbar above to format text, add headings, callout boxes, and images.",
      }),
    ],
    // Accept HTML (new articles) or plain text/Markdown (legacy) as initial content
    content: prepareEditorContent(value),
    onUpdate({ editor: ed }) {
      internalChange.current = true;
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none min-h-[420px] px-8 py-6 outline-none focus:outline-none [&>*:first-child]:mt-0",
      },
      /**
       * Strip all inline styles except text-align and color when content is
       * pasted from Google Docs (or any external source).
       * This allowlist is intentionally identical to cleanInlineStyles() in
       * PlaybookArticleHtml so what editors see in the editor exactly matches
       * what readers see on the published article page.
       */
      transformPastedHTML(html: string) {
        const ALLOWED = new Set(["text-align", "color"]);
        return html.replace(/\bstyle="([^"]*)"/gi, (_match: string, styleContent: string) => {
          const kept = styleContent
            .split(";")
            .map((r: string) => r.trim())
            .filter((r: string) => {
              const prop = r.split(":")[0]?.trim().toLowerCase() ?? "";
              return ALLOWED.has(prop) && r.includes(":");
            });
          if (!kept.length) return "";
          return `style="${kept.join("; ")}"`;
        });
      },
    },
  });

  // Sync when parent swaps the article (e.g. switching between articles in the list)
  useEffect(() => {
    if (!editor) return;
    if (internalChange.current) {
      internalChange.current = false;
      return;
    }
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(prepareEditorContent(value));
    }
  }, [value, editor]);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const file = Array.from(files ?? []).find(isImageFile);
      if (!file) {
        setUploadStatus({ kind: "error", message: "Please choose an image file." });
        return;
      }
      setUploading(true);
      setUploadStatus(null);
      try {
        const url = await uploadPlaybookArticleImage(file);
        editor?.chain().focus().setImage({ src: url, alt: "Article illustration" }).run();
        setUploadStatus({
          kind: "success",
          message: "Photo inserted. Click Save changes at the bottom to keep it.",
        });
      } catch (err) {
        setUploadStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Image upload failed. Please try again.",
        });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounter.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => {
          dragCounter.current -= 1;
          if (dragCounter.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragCounter.current = 0;
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <Toolbar
          editor={editor}
          onImageUpload={() => fileInputRef.current?.click()}
          uploading={uploading}
        />

        <div
          className={cn(
            "relative bg-neutral-50 px-4 py-4 transition-colors",
            dragging && "bg-primary-50",
          )}
        >
          <div className="mx-auto max-w-3xl rounded bg-white shadow-sm ring-1 ring-neutral-200">
            <EditorContent editor={editor} />
          </div>

          {dragging && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                <Upload className="h-4 w-4" />
                Drop to insert image
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-neutral-100 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-400">
          <Upload className="h-3 w-3 shrink-0" />
          Drag &amp; drop an image anywhere in the editor, or click the image icon in the toolbar
        </div>
      </div>

      {uploadStatus && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
            uploadStatus.kind === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {uploadStatus.kind === "success" && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}
