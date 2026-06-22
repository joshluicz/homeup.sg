"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Star, Trash2, X, ChevronUp, Link as LinkIcon, Upload, FileText, Layers, Search, ExternalLink, BookOpen } from "lucide-react";
import { CATEGORY_LABELS, TOPIC_LABELS } from "@/lib/data/playbook";
import { videoThumbnail } from "@/lib/playbook/embed";
import type { PlaybookTopic } from "@/lib/data/playbook";
import { PlaybookArticleEditor } from "@/components/admin/PlaybookArticleEditor";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type VideoCategory = "selling" | "buying" | "process" | "market" | "tips";
const CATEGORIES: VideoCategory[] = ["selling", "buying", "process", "market", "tips"];
const TOPICS: PlaybookTopic[] = ["upgraders", "buying_first", "condo_tips"];

type ContentType = "article" | "hybrid";

const CONTENT_TYPES: { id: ContentType; label: string; description: string; Icon: typeof FileText }[] = [
  {
    id: "article",
    label: "Article only",
    description: "Written guide at /playbook/{slug} — no video required.",
    Icon: FileText,
  },
  {
    id: "hybrid",
    label: "Article + video",
    description: "Full guide with an embedded watch-along video.",
    Icon: Layers,
  },
];

function inferContentType(v: Pick<Video, "article" | "video_url">): ContentType {
  return v.video_url?.trim() ? "hybrid" : "article";
}

function contentTypeLabel(v: Pick<Video, "article" | "video_url">): string {
  const hasArticle = Boolean(v.article?.trim());
  const hasVideo = Boolean(v.video_url?.trim());
  if (hasArticle && hasVideo) return "Article + video";
  if (hasArticle) return "Article";
  if (hasVideo) return "Video";
  return "Draft";
}

function contentTypeBadgeClass(label: string): string {
  if (label === "Article + video") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (label === "Article") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (label === "Video") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-neutral-100 text-neutral-500 ring-neutral-200";
}

const TOPIC_BADGE: Record<PlaybookTopic, string> = {
  upgraders: "bg-amber-50 text-amber-800 ring-amber-200",
  buying_first: "bg-sky-50 text-sky-800 ring-sky-200",
  condo_tips: "bg-violet-50 text-violet-800 ring-violet-200",
};

type TopicFilter = "all" | PlaybookTopic | "none";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 border-b border-neutral-100 pb-3">
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        {description && <p className="mt-1 text-xs font-normal text-neutral-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

type FaqEntry = { q: string; a: string };

type Video = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: VideoCategory;
  duration: string;
  thumbnail: string;
  video_url: string;
  featured: boolean;
  published_at: string;
  tags: string[];
  article?: string;
  faq?: FaqEntry[];
  meta_description?: string;
  topic?: PlaybookTopic | null;
};

const emptyForm = {
  title: "",
  description: "",
  category: "selling" as VideoCategory,
  topic: "" as PlaybookTopic | "",
  duration: "",
  thumbnail: "",
  video_url: "",
  featured: false,
  published_at: new Date().toISOString().slice(0, 10),
  tags: "",
  article: "",
  meta_description: "",
};

// Grab a poster frame from an uploaded video file, entirely in the browser (no server/ffmpeg).
function capturePoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const done = (blob: Blob | null) => { URL.revokeObjectURL(url); resolve(blob); };
    video.onloadedmetadata = () => { video.currentTime = Math.min(1, (video.duration || 2) / 2); };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return done(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => done(blob), "image/jpeg", 0.8);
    };
    video.onerror = () => done(null);
    video.src = url;
  });
}

function slugify(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) +
    "-" + Date.now().toString(36)
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-neutral-200" />
          <div className="h-4 w-20 rounded bg-neutral-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-neutral-200" />
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 flex gap-6">
          {["Title", "Type", "Category", "Published"].map((h) => (
            <div key={h} className="h-3 w-16 rounded bg-neutral-200" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-neutral-100 last:border-0">
            <div className="h-10 w-16 rounded-lg bg-neutral-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 rounded bg-neutral-100" />
              <div className="h-3 w-24 rounded bg-neutral-100" />
            </div>
            <div className="h-4 w-20 rounded bg-neutral-100 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlaybookTab() {
  const supabase = createClient();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [contentType, setContentType] = useState<ContentType>("article");
  const [faq, setFaq] = useState<FaqEntry[]>([]);
  const [uploadTab, setUploadTab] = useState<"link" | "file">("link");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const articles = videos.filter((v) => v.article?.trim()).length;
    const hybrid = videos.filter((v) => v.article?.trim() && v.video_url?.trim()).length;
    const featured = videos.filter((v) => v.featured).length;
    return { total: videos.length, articles, hybrid, featured };
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((v) => {
      if (topicFilter === "none" && v.topic) return false;
      if (topicFilter !== "all" && topicFilter !== "none" && v.topic !== topicFilter) return false;
      if (!q) return true;
      return (
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.slug.toLowerCase().includes(q) ||
        CATEGORY_LABELS[v.category].toLowerCase().includes(q)
      );
    });
  }, [videos, searchQuery, topicFilter]);

  async function loadVideos() {
    const { data } = await supabase
      .from("playbook_videos")
      .select("*")
      .order("published_at", { ascending: false });
    setVideos((data as Video[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadVideos(); }, []);

  function set(field: keyof typeof emptyForm, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setFaqItem(index: number, key: keyof FaqEntry, value: string) {
    setFaq((items) => items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }
  function addFaqItem() {
    setFaq((items) => [...items, { q: "", a: "" }]);
  }
  function removeFaqItem(index: number) {
    setFaq((items) => items.filter((_, i) => i !== index));
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setContentType("article");
    setFaq([]);
    setError(null);
    setUploadTab("link");
    setUploadProgress(null);
    setShowForm(true);
  }

  function openEdit(v: Video) {
    setEditId(v.id);
    setForm({
      title: v.title,
      description: v.description,
      category: v.category,
      topic: (v.topic ?? "") as PlaybookTopic | "",
      duration: v.duration,
      thumbnail: v.thumbnail,
      video_url: v.video_url,
      featured: v.featured,
      published_at: v.published_at,
      tags: v.tags?.join(", ") ?? "",
      article: v.article ?? "",
      meta_description: v.meta_description ?? "",
    });
    setFaq(v.faq ?? []);
    setContentType(inferContentType(v));
    setError(null);
    setUploadTab(v.video_url?.startsWith("http") ? "link" : "file");
    setUploadProgress(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setError(null);
    setUploadProgress(null);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadProgress("Uploading…");
    setError(null);

    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from("playbook-videos")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      setUploadProgress(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("playbook-videos").getPublicUrl(data.path);
    setForm((f) => ({ ...f, video_url: urlData.publicUrl }));

    // Auto-generate a thumbnail from the video's first frame.
    setUploadProgress("Generating thumbnail…");
    const poster = await capturePoster(file);
    if (poster) {
      const tpath = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { data: tdata, error: terr } = await supabase.storage
        .from("playbook-videos")
        .upload(tpath, poster, { contentType: "image/jpeg", upsert: false });
      if (!terr && tdata) {
        const { data: turl } = supabase.storage.from("playbook-videos").getPublicUrl(tdata.path);
        setForm((f) => ({ ...f, thumbnail: f.thumbnail || turl.publicUrl }));
      }
    }
    setUploadProgress("✓ Uploaded");
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }

    const hasArticle = Boolean(form.article.trim());
    const hasVideo = Boolean(form.video_url.trim());

    if (contentType === "article" && !hasArticle) {
      setError("Article body is required for article-only guides.");
      return;
    }
    if (contentType === "hybrid") {
      if (!hasArticle) {
        setError("Article body is required for article + video guides.");
        return;
      }
      if (!hasVideo) {
        setError("Add a video link or upload a file for article + video guides.");
        return;
      }
    }

    setSaving(true);
    setError(null);

    const payload = {
      slug: editId ? undefined : slugify(form.title),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      topic: form.topic || null,
      duration: contentType === "hybrid" ? form.duration.trim() : "",
      thumbnail: form.thumbnail.trim(),
      video_url: contentType === "hybrid" ? form.video_url.trim() : "",
      featured: form.featured,
      published_at: form.published_at,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      article: form.article,
      meta_description: form.meta_description.trim(),
      faq: faq
        .map((item) => ({ q: item.q.trim(), a: item.a.trim() }))
        .filter((item) => item.q && item.a),
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error: dbError } = await supabase
        .from("playbook_videos")
        .update(payload)
        .eq("id", editId);
      if (dbError) { setError(dbError.message); setSaving(false); return; }
    } else {
      const { error: dbError } = await supabase
        .from("playbook_videos")
        .insert({ ...payload, created_at: new Date().toISOString() });
      if (dbError) { setError(dbError.message); setSaving(false); return; }
    }

    await revalidatePlaybook();
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    await loadVideos();
  }

  // Push the direct-Supabase save/delete live on the ISR-cached public pages immediately.
  async function revalidatePlaybook() {
    try {
      await fetch("/api/admin/playbook/revalidate", { method: "POST" });
    } catch {
      /* non-fatal: pages still refresh on the next ISR window */
    }
  }

  async function handleDelete(v: Video) {
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    setDeleting(v.id);
    await supabase.from("playbook_videos").delete().eq("id", v.id);
    await revalidatePlaybook();
    setDeleting(null);
    await loadVideos();
  }

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Content</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-neutral-900">Playbook guides</h1>
          <p className="mt-1 text-sm font-normal text-neutral-500">
            Manage articles and hybrid video guides for the public playbook.
          </p>
        </div>
        {!showForm && (
          <Button onClick={openAdd} className="flex shrink-0 items-center gap-2 self-start">
            <Plus className="h-4 w-4" />
            Add guide
          </Button>
        )}
      </div>

      {/* Stats */}
      {!showForm && videos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total guides", value: stats.total },
            { label: "With articles", value: stats.articles },
            { label: "Article + video", value: stats.hybrid },
            { label: "Featured", value: stats.featured },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">{label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-neutral-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filters */}
      {!showForm && videos.length > 0 && (
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, slug, category…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All topics"],
                ["upgraders", TOPIC_LABELS.upgraders],
                ["buying_first", TOPIC_LABELS.buying_first],
                ["condo_tips", TOPIC_LABELS.condo_tips],
                ["none", "Unassigned"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTopicFilter(id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  topicFilter === id
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:bg-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
                {editId ? "Editing" : "New guide"}
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-neutral-900">
                {editId ? "Edit guide" : "Add guide"}
              </h2>
            </div>
            <button type="button" onClick={cancelForm} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <X className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormSection title="Content type" description="Choose whether this guide is article-only or includes a video.">
            {/* Content type */}
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {CONTENT_TYPES.map(({ id, label, description, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setContentType(id);
                      if (id === "article") {
                        setForm((f) => ({ ...f, video_url: "", duration: "" }));
                        setUploadProgress(null);
                      }
                    }}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                      contentType === id
                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${contentType === id ? "text-primary-600" : "text-neutral-400"}`} />
                    <span>
                      <span className="block text-sm font-bold text-neutral-900">{label}</span>
                      <span className="mt-0.5 block text-xs font-normal text-neutral-500">{description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            </FormSection>

            <FormSection title="Basics" description="Title and card hook shown on the public playbook.">
            {/* Title */}
            <div>
              <FieldLabel required>Title</FieldLabel>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. How We Saved a Seller $32,000 in Commission"
                className={inputClass}
                required
              />
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Card hook / description</FieldLabel>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="Short hook shown on playbook cards..."
                className={inputClass}
              />
            </div>
            </FormSection>

            <FormSection title="Placement" description="Category, journey stage, tags, and publish settings.">
            {/* Category */}
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            {/* Journey topic */}
            <div>
              <FieldLabel>Journey topic</FieldLabel>
              <p className="mb-2 text-xs font-normal text-neutral-500">Which Playbook Journey stage this appears under on the public site.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => set("topic", "")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    !form.topic ? "border-primary-500 bg-primary-50 text-primary-700" : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                  }`}
                >
                  No topic
                </button>
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("topic", t)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.topic === t ? "border-primary-500 bg-primary-50 text-primary-700" : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                    }`}
                  >
                    {TOPIC_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags + Published */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Tags</FieldLabel>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="hdb, selling, tips (comma-separated)"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Publish date</FieldLabel>
                <input
                  type="date"
                  value={form.published_at}
                  onChange={(e) => set("published_at", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Featured */}
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 accent-primary-600"
              />
              <span className="text-sm font-semibold text-neutral-900">
                Featured{" "}
                <span className="font-normal text-neutral-500">— main item in its topic</span>
              </span>
            </label>
            </FormSection>

            {/* Article & SEO */}
            <FormSection
              title="Article & SEO"
              description="Required written guide for search and the public /playbook/[slug] page."
            >
              <div>
                <FieldLabel>Meta description</FieldLabel>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                  rows={2}
                  maxLength={170}
                  placeholder="~155-character summary shown in Google search results."
                  className={inputClass}
                />
                <p className="mt-1 text-xs font-normal text-neutral-400">{form.meta_description.length}/155 recommended</p>
              </div>

              <div>
                <FieldLabel required>Article (Markdown)</FieldLabel>
                <PlaybookArticleEditor
                  value={form.article}
                  onChange={(article) => set("article", article)}
                  textareaClassName={cn(inputClass, "font-mono text-xs leading-relaxed")}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <FieldLabel>FAQ</FieldLabel>
                  <button type="button" onClick={addFaqItem} className="text-xs font-bold text-primary-600 hover:underline">
                    + Add question
                  </button>
                </div>
                {faq.length === 0 && (
                  <p className="text-xs font-normal text-neutral-400">Optional — helps SEO and AI answers.</p>
                )}
                <div className="space-y-3">
                  {faq.map((item, i) => (
                    <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-600">Question {i + 1}</span>
                        <button type="button" onClick={() => removeFaqItem(i)} aria-label="Remove question" className="text-neutral-400 hover:text-red-500">
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
                        placeholder="Answer"
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </FormSection>

            {contentType === "hybrid" && (
              <FormSection title="Video" description="YouTube/Vimeo link or uploaded file — shown in the article hero.">
                <div className="flex w-fit gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
                  <button
                    type="button"
                    onClick={() => setUploadTab("link")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                      uploadTab === "link" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700",
                    )}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Paste link
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadTab("file")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                      uploadTab === "file" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700",
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload file
                  </button>
                </div>

                {uploadTab === "link" ? (
                  <input
                    type="url"
                    value={form.video_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      const thumb = videoThumbnail(url);
                      setForm((f) => ({ ...f, video_url: url, thumbnail: f.thumbnail || thumb }));
                    }}
                    placeholder="https://www.youtube.com/watch?v=... or Vimeo URL"
                    className={inputClass}
                  />
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-6 py-8 text-center transition-colors hover:border-primary-300 hover:bg-primary-50"
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                          <p className="text-sm font-semibold text-primary-600">Uploading to Supabase Storage…</p>
                        </div>
                      ) : uploadProgress === "✓ Uploaded" ? (
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-sm font-bold text-green-600">✓ File uploaded</p>
                          <p className="max-w-xs truncate text-xs text-neutral-400">{form.video_url}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-7 w-7 text-neutral-300" />
                          <p className="text-sm font-semibold text-neutral-600">Click to upload a video file</p>
                          <p className="text-xs text-neutral-400">MP4, MOV, WebM</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <FieldLabel>Thumbnail URL</FieldLabel>
                  <input
                    type="url"
                    value={form.thumbnail}
                    onChange={(e) => set("thumbnail", e.target.value)}
                    placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                    className={inputClass}
                  />
                  {form.thumbnail && (
                    <img src={form.thumbnail} alt="" className="mt-2 h-20 w-36 rounded-lg border border-neutral-200 object-cover" />
                  )}
                </div>

                <div>
                  <FieldLabel>Duration</FieldLabel>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => set("duration", e.target.value)}
                    placeholder="e.g. 4:32"
                    className={inputClass}
                  />
                </div>
              </FormSection>
            )}

            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <Button type="submit" disabled={saving || uploading} className="min-w-[100px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Save changes" : "Add guide"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Guide list */}
      {videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-4 text-sm font-semibold text-neutral-700">No guides yet</p>
          <p className="mt-1 text-sm font-normal text-neutral-500">Add your first article to populate the public playbook.</p>
          {!showForm && (
            <Button onClick={openAdd} className="mt-6">Add your first guide</Button>
          )}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white py-12 text-center">
          <p className="text-sm font-semibold text-neutral-700">No guides match your search</p>
          <button type="button" onClick={() => { setSearchQuery(""); setTopicFilter("all"); }} className="mt-2 text-sm font-semibold text-primary-600 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredVideos.map((v) => {
            const typeLabel = contentTypeLabel(v);
            const slug = v.slug?.trim();
            const previewHref = slug ? `/playbook/${slug}` : null;

            return (
              <article
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEdit(v);
                  }
                }}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow touch-manipulation hover:border-primary-200 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] bg-neutral-100">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText className="h-8 w-8 text-neutral-300" />
                    </div>
                  )}
                  {v.featured && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1", contentTypeBadgeClass(typeLabel))}>
                      {typeLabel}
                    </span>
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                      {CATEGORY_LABELS[v.category]}
                    </span>
                    {v.topic && (
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1", TOPIC_BADGE[v.topic])}>
                        {TOPIC_LABELS[v.topic]}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base font-bold leading-snug text-neutral-900 line-clamp-2 group-hover:text-primary-700">
                    {v.title}
                  </h3>

                  {v.description?.trim() && (
                    <p className="mt-2 line-clamp-2 text-sm font-normal leading-relaxed text-neutral-500">
                      {v.description}
                    </p>
                  )}

                  <p className="mt-3 text-xs font-semibold text-primary-600">
                    Tap to edit →
                  </p>
                </div>

                <div
                  className="flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-neutral-400">{v.published_at}</p>
                  <div className="flex items-center gap-1.5">
                    {previewHref && (
                      <Button variant="outline" size="sm" asChild title="Preview on live site (opens new tab)">
                        <Link href={previewHref} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(v)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(v)}
                      disabled={deleting === v.id}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      {deleting === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
