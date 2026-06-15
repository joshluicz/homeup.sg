"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Pencil, Plus, Star, Trash2, X, ChevronUp } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/data/playbook";

type VideoCategory = "selling" | "buying" | "process" | "market" | "tips";
const CATEGORIES: VideoCategory[] = ["selling", "buying", "process", "market", "tips"];

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
};

const emptyForm = {
  title: "",
  description: "",
  category: "selling" as VideoCategory,
  duration: "",
  thumbnail: "",
  video_url: "",
  featured: false,
  published_at: new Date().toISOString().slice(0, 10),
  tags: "",
};

export function PlaybookTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  // loading handled above with skeleton
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function loadVideos() {
    setLoading(true);
    const res = await fetch("/api/admin/playbook");
    if (res.ok) setVideos(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadVideos(); }, []);

  function set(field: keyof typeof emptyForm, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(v: Video) {
    setEditId(v.id);
    setForm({
      title: v.title,
      description: v.description,
      category: v.category,
      duration: v.duration,
      thumbnail: v.thumbnail,
      video_url: v.video_url,
      featured: v.featured,
      published_at: v.published_at,
      tags: v.tags?.join(", ") ?? "",
    });
    setError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);

    const payload = {
      ...(editId ? { id: editId } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      duration: form.duration.trim(),
      thumbnail: form.thumbnail.trim(),
      videoUrl: form.video_url.trim(),
      featured: form.featured,
      publishedAt: form.published_at,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const res = await fetch("/api/admin/playbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to save"); setSaving(false); return; }

    setSaving(false);
    setShowForm(false);
    setEditId(null);
    await loadVideos();
  }

  async function handleDelete(v: Video) {
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    setDeleting(v.id);
    await fetch("/api/admin/playbook", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id }),
    });
    setDeleting(null);
    await loadVideos();
  }

  if (loading) {
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
            {["Video", "Category", "Duration", "Published", "Actions"].map((h) => (
              <div key={h} className="h-3 w-16 rounded bg-neutral-200" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-neutral-100 last:border-0">
              <div className="h-10 w-16 rounded-lg bg-neutral-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-48 rounded bg-neutral-100" />
                <div className="h-3 w-24 rounded bg-neutral-100" />
              </div>
              <div className="h-4 w-20 rounded bg-neutral-100" />
              <div className="h-4 w-12 rounded bg-neutral-100" />
              <div className="h-4 w-20 rounded bg-neutral-100" />
              <div className="flex gap-2 ml-auto">
                <div className="h-8 w-8 rounded-lg bg-neutral-100" />
                <div className="h-8 w-8 rounded-lg bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

            {/* Video URL */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900">Video URL</label>
              <input
                type="url"
                value={form.video_url}
                onChange={(e) => set("video_url", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or Vimeo URL"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
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

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={saving} className="min-w-[100px]">
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
                          <span className="text-xs text-neutral-400">No URL yet</span>
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
