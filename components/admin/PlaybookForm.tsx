"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2, X, Sparkles, Link, Upload } from "lucide-react";
import type { PlaybookVideo, VideoCategory } from "@/lib/data/playbook";
import { CATEGORY_LABELS } from "@/lib/data/playbook";

const CATEGORIES: Exclude<VideoCategory, "all">[] = ["selling", "buying", "process", "market", "tips"];

type FormState = {
  title: string;
  description: string;
  category: Exclude<VideoCategory, "all">;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  featured: boolean;
  publishedAt: string;
  tags: string;
};

function toFormState(v?: PlaybookVideo): FormState {
  return {
    title: v?.title ?? "",
    description: v?.description ?? "",
    category: (v?.category as Exclude<VideoCategory, "all">) ?? "selling",
    duration: v?.duration ?? "",
    thumbnail: v?.thumbnail ?? "",
    videoUrl: v?.videoUrl ?? "",
    featured: v?.featured ?? false,
    publishedAt: v?.publishedAt ?? new Date().toISOString().slice(0, 10),
    tags: v?.tags?.join(", ") ?? "",
  };
}

interface PlaybookFormProps {
  video?: PlaybookVideo;
}

export function PlaybookForm({ video }: PlaybookFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(video));
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [uploadTab, setUploadTab] = useState<"link" | "file">("link");

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "videoUrl") setAiSuccess(false);
  }

  async function handleAiFill() {
    if (!form.videoUrl.trim()) {
      setError("Paste a YouTube or Vimeo URL first.");
      return;
    }
    setAiLoading(true);
    setError(null);
    setAiSuccess(false);

    const res = await fetch("/api/admin/playbook-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: form.videoUrl.trim() }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "AI generation failed");
      setAiLoading(false);
      return;
    }

    setForm((f) => ({
      ...f,
      title: json.title ?? f.title,
      description: json.description ?? f.description,
      thumbnail: json.thumbnail || f.thumbnail,
    }));
    setAiSuccess(true);
    setAiLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.category) {
      setError("Title and category are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...(video?.id ? { id: video.id } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      duration: form.duration.trim(),
      thumbnail: form.thumbnail.trim(),
      videoUrl: form.videoUrl.trim(),
      featured: form.featured,
      publishedAt: form.publishedAt,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const res = await fetch("/api/admin/playbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin/playbook");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <X className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Video source tabs */}
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-900">Video source</p>
        <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 w-fit gap-1">
          <button
            type="button"
            onClick={() => setUploadTab("link")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              uploadTab === "link"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <Link className="h-3.5 w-3.5" />
            Paste link
          </button>
          <button
            type="button"
            onClick={() => setUploadTab("file")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              uploadTab === "file"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload file
          </button>
        </div>

        <div className="mt-3">
          {uploadTab === "link" ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or Vimeo URL"
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAiFill}
                  disabled={aiLoading || !form.videoUrl.trim()}
                  className="shrink-0 flex items-center gap-1.5 border-primary-200 text-primary-700 hover:bg-primary-50"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {aiLoading ? "Generating…" : "AI fill"}
                </Button>
              </div>
              {aiSuccess && (
                <p className="flex items-center gap-1.5 text-xs text-primary-600">
                  <Sparkles className="h-3 w-3" />
                  Title, description and thumbnail auto-filled — edit freely below.
                </p>
              )}
              <p className="text-xs text-neutral-400">
                Paste a YouTube or Vimeo link, then click <strong>AI fill</strong> to auto-generate a title and description.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
              <Upload className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
              <p className="text-sm font-medium text-neutral-600">Upload a video file</p>
              <p className="mt-1 text-xs text-neutral-400">
                For best results, upload to YouTube or Vimeo first, then use the <strong>Paste link</strong> tab. Direct video hosting incurs storage costs.
              </p>
              <p className="mt-3 text-xs text-neutral-500">
                If you still want to upload directly, ask your developer to connect Supabase Storage or an S3 bucket.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-900">
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
        <label className="mb-1.5 block text-sm font-medium text-neutral-900">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="Brief summary shown on the video card..."
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Category + Duration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-900">
            Category <span className="text-red-500">*</span>
          </label>
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
          <label className="mb-1.5 block text-sm font-medium text-neutral-900">Duration</label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => set("duration", e.target.value)}
            placeholder="e.g. 4:32"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-900">Thumbnail URL</label>
        <input
          type="url"
          value={form.thumbnail}
          onChange={(e) => set("thumbnail", e.target.value)}
          placeholder="Auto-filled from YouTube, or paste your own image URL"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
        {form.thumbnail && (
          <img
            src={form.thumbnail}
            alt="Thumbnail preview"
            className="mt-2 h-24 w-44 rounded-lg object-cover border border-neutral-200"
          />
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-900">Tags</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="hdb, selling, commission (comma-separated)"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Publish date + Featured */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-900">Publish Date</label>
          <input
            type="date"
            value={form.publishedAt}
            onChange={(e) => set("publishedAt", e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 px-4 py-2.5 w-full">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 accent-primary-600"
            />
            <span className="text-sm font-medium text-neutral-900">Featured video</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving} className="min-w-[100px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : video ? "Save changes" : "Add video"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/playbook")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
