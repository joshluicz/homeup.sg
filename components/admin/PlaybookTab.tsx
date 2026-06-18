"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Pencil, Plus, Star, Trash2, X, ChevronUp, Link, Upload } from "lucide-react";
import { CATEGORY_LABELS, TOPIC_LABELS } from "@/lib/data/playbook";
import type { PlaybookTopic } from "@/lib/data/playbook";
import { createClient } from "@/lib/supabase/client";

type VideoCategory = "selling" | "buying" | "process" | "market" | "tips";
const CATEGORIES: VideoCategory[] = ["selling", "buying", "process", "market", "tips"];

const TOPICS: PlaybookTopic[] = ["upgraders", "buying_first", "condo_tips"];

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
          {["Video", "Category", "Duration", "Published"].map((h) => (
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
  const [faq, setFaq] = useState<FaqEntry[]>([]);
  const [uploadTab, setUploadTab] = useState<"link" | "file">("link");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUploadProgress("✓ Uploaded");
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);

    const payload = {
      slug: editId ? undefined : slugify(form.title),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      topic: form.topic || null,
      duration: form.duration.trim(),
      thumbnail: form.thumbnail.trim(),
      video_url: form.video_url.trim(),
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

    setSaving(false);
    setShowForm(false);
    setEditId(null);
    await loadVideos();
  }

  async function handleDelete(v: Video) {
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    setDeleting(v.id);
    await supabase.from("playbook_videos").delete().eq("id", v.id);
    setDeleting(null);
    await loadVideos();
  }

  if (loading) return <TableSkeleton />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Playbook Videos</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{videos.length} video{videos.length !== 1 ? "s" : ""}</p>
        </div>
        {!showForm && (
          <Button onClick={openAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add video
          </Button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">
              {editId ? "Edit video" : "Add video"}
            </h2>
            <button type="button" onClick={cancelForm} className="text-neutral-400 hover:text-neutral-600">
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <X className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. How We Saved a Seller $32,000 in Commission"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="Brief summary shown on the video card..."
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Video source */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-900">Video</label>
              <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 w-fit gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => setUploadTab("link")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    uploadTab === "link" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <Link className="h-3.5 w-3.5" />
                  Paste link
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTab("file")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    uploadTab === "file" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload file
                </button>
              </div>

              {uploadTab === "link" ? (
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(e) => set("video_url", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or Vimeo URL"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
                    className="cursor-pointer rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-6 py-8 text-center hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                        <p className="text-sm text-primary-600">Uploading to Supabase Storage…</p>
                      </div>
                    ) : uploadProgress === "✓ Uploaded" ? (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-sm font-semibold text-green-600">✓ File uploaded</p>
                        <p className="text-xs text-neutral-400 truncate max-w-xs">{form.video_url}</p>
                        <p className="text-xs text-neutral-400 mt-1">Click to replace</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-7 w-7 text-neutral-300" />
                        <p className="text-sm font-medium text-neutral-600">Click to upload a video file</p>
                        <p className="text-xs text-neutral-400">MP4, MOV, WebM — stored in Supabase Storage</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900">Thumbnail URL</label>
              <input
                type="url"
                value={form.thumbnail}
                onChange={(e) => set("thumbnail", e.target.value)}
                placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              {form.thumbnail && (
                <img src={form.thumbnail} alt="" className="mt-2 h-20 w-36 rounded-lg object-cover border border-neutral-200" />
              )}
            </div>

            {/* Category + Duration */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Duration</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => set("duration", e.target.value)}
                  placeholder="e.g. 4:32"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Journey topic */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900">Journey topic</label>
              <p className="mb-2 text-xs text-neutral-400">Slot this into one of the three Playbook Journey stages shown on the public page.</p>
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
                <label className="mb-1 block text-sm font-medium text-neutral-900">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="hdb, selling, tips (comma-separated)"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Publish Date</label>
                <input
                  type="date"
                  value={form.published_at}
                  onChange={(e) => set("published_at", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Featured */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 accent-primary-600"
              />
              <span className="text-sm font-medium text-neutral-900">Featured video</span>
            </label>

            {/* Article & SEO */}
            <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Article &amp; SEO</p>
                <p className="text-xs text-neutral-400">
                  Optional. Publishes a readable guide at /playbook/{"{slug}"} so this video can be found in search and AI answers.
                </p>
              </div>

              {/* Meta description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Meta description</label>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                  rows={2}
                  maxLength={170}
                  placeholder="~155-character summary shown in Google search results."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
                <p className="mt-1 text-xs text-neutral-400">{form.meta_description.length}/155 recommended</p>
              </div>

              {/* Article (Markdown) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Article (Markdown)</label>
                <textarea
                  value={form.article}
                  onChange={(e) => set("article", e.target.value)}
                  rows={12}
                  placeholder={"## Heading\n\nWrite the full guide here. Supports Markdown: ## headings, **bold**, - lists, [links](url)."}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs leading-relaxed text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {/* FAQ */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-neutral-900">FAQ</label>
                  <button type="button" onClick={addFaqItem} className="text-xs font-semibold text-primary-600 hover:underline">
                    + Add question
                  </button>
                </div>
                {faq.length === 0 && (
                  <p className="text-xs text-neutral-400">Add common questions to boost search and AI-answer reach.</p>
                )}
                <div className="space-y-3">
                  {faq.map((item, i) => (
                    <div key={i} className="rounded-lg border border-neutral-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-500">Question {i + 1}</span>
                        <button type="button" onClick={() => removeFaqItem(i)} aria-label="Remove question" className="text-neutral-400 hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.q}
                        onChange={(e) => setFaqItem(i, "q", e.target.value)}
                        placeholder="Question"
                        className="mb-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                      />
                      <textarea
                        value={item.a}
                        onChange={(e) => setFaqItem(i, "a", e.target.value)}
                        rows={2}
                        placeholder="Answer"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={saving || uploading} className="min-w-[100px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Save changes" : "Add video"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Video list */}
      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-sm text-neutral-500">No videos yet.</p>
          {!showForm && (
            <Button onClick={openAdd} className="mt-4">Add your first video</Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {videos.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {v.thumbnail ? (
                        <img src={v.thumbnail} alt="" className="h-10 w-16 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-16 shrink-0 rounded-lg bg-neutral-100" />
                      )}
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium text-neutral-900 truncate max-w-xs">
                          {v.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                          {v.title}
                        </p>
                        {v.video_url ? (
                          <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                            View video ↗
                          </a>
                        ) : (
                          <span className="text-xs text-neutral-400">No video yet</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{CATEGORY_LABELS[v.category]}</td>
                  <td className="px-4 py-3 text-neutral-600">{v.duration || "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{v.published_at}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(v)}
                        disabled={deleting === v.id}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {deleting === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
