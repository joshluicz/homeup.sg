"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Star, Trash2, X, ChevronUp, Link as LinkIcon, Upload, FileText, Layers, Search, ExternalLink, BookOpen } from "lucide-react";
import { CATEGORY_LABELS, TOPIC_LABELS, PLAYBOOK_TOPICS, inferPlaybookTopicFromCategory } from "@/lib/data/playbook";
import { getPlaybookAgentOptions } from "@/lib/playbook/agent-attribution";
import { resolveThumbnail, resolveVideoThumbnailCandidatesForDisplay } from "@/lib/playbook/embed";
import { resolveArticleThumbnail } from "@/lib/playbook/article-thumbnails";
import type { PlaybookTopic } from "@/lib/data/playbook";
import { PlaybookArticleEditor } from "@/components/admin/PlaybookArticleEditor";
import { createClient } from "@/lib/supabase/client";
import {
  uploadPlaybookArticleImage,
  uploadPlaybookThumbnail,
  uploadPlaybookVideoFile,
} from "@/lib/playbook/storage";
import { PLAYBOOK_ARTICLE_TEMPLATE } from "@/lib/playbook/article-format";
import { isPlaybookArticle, isPlaybookVideo } from "@/lib/playbook/content-kind";
import {
  isSheetCatalogueAdminId,
  mergeAdminPlaybookVideos,
} from "@/lib/playbook/admin-videos";
import { cn } from "@/lib/utils";

type VideoCategory = "selling" | "buying" | "process" | "market" | "tips";
const CATEGORIES: VideoCategory[] = ["selling", "buying", "process", "market", "tips"];

type ContentType = "article" | "video";

function matchesMode(v: Video, mode: ContentType): boolean {
  const row = { article: v.article, videoUrl: v.video_url };
  return mode === "video" ? isPlaybookVideo(row) : isPlaybookArticle(row);
}

const TOPIC_BADGE: Record<PlaybookTopic, string> = {
  upgraders: "bg-amber-50 text-amber-800 ring-amber-200",
  buying_first: "bg-sky-50 text-sky-800 ring-sky-200",
  condo_tips: "bg-violet-50 text-violet-800 ring-violet-200",
};

type TopicFilter = "all" | PlaybookTopic | "none";
const AGENT_OPTIONS = getPlaybookAgentOptions();

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
  sheetCatalogue?: boolean;
  agent_slug?: string | null;
};

const emptyForm = {
  title: "",
  description: "",
  category: "selling" as VideoCategory,
  topic: "upgraders" as PlaybookTopic,
  duration: "",
  thumbnail: "",
  video_url: "",
  featured: false,
  published_at: new Date().toISOString().slice(0, 10),
  tags: "",
  article: "",
  meta_description: "",
  agentSlug: "",
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

export function PlaybookTab({ mode }: { mode: ContentType }) {
  const isVideoMode = mode === "video";
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
  const [coverUploading, setCoverUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);

  const editingEntry = editId ? videos.find((v) => v.id === editId) : null;
  const editingSlug = editingEntry?.slug ?? "";
  const catalogueCount = useMemo(
    () => videos.filter((v) => v.sheetCatalogue).length,
    [videos],
  );

  const stats = useMemo(() => {
    const scoped = videos.filter((v) => matchesMode(v, mode));
    const featured = scoped.filter((v) => v.featured).length;
    return { total: scoped.length, featured };
  }, [videos, mode]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((v) => {
      if (!matchesMode(v, mode)) return false;
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
  }, [videos, searchQuery, topicFilter, mode]);

  useEffect(() => {
    setShowForm(false);
    setEditId(null);
  }, [mode]);

  async function loadVideos() {
    const { data } = await supabase
      .from("playbook_videos")
      .select("*")
      .order("published_at", { ascending: false });
    setVideos(mergeAdminPlaybookVideos((data as Video[]) ?? [], mode) as Video[]);
    setLoading(false);
  }

  async function syncSheetVideos() {
    const count = catalogueCount || "all live-site";
    if (!confirm(`Import ${count} video(s) from the live playbook into the database?`)) return;

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/playbook/sync-sheet-videos", { method: "POST" });
      const data = (await response.json()) as { error?: string; upserted?: number; total?: number };
      if (!response.ok) throw new Error(data.error || "Sync failed.");

      await revalidatePlaybook();
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sync live videos.");
    } finally {
      setSyncing(false);
    }
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
    setForm({
      ...emptyForm,
      topic: "upgraders",
      article: isVideoMode ? "" : PLAYBOOK_ARTICLE_TEMPLATE,
    });
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
      description: isVideoMode ? "" : v.description,
      category: v.category,
      topic: (v.topic ?? inferPlaybookTopicFromCategory(v.category)) as PlaybookTopic,
      duration: isVideoMode ? v.duration : "",
      thumbnail: v.thumbnail,
      video_url: isVideoMode ? v.video_url : "",
      featured: v.featured,
      published_at: v.published_at,
      tags: v.tags?.join(", ") ?? "",
      article: isVideoMode ? "" : (v.article ?? ""),
      meta_description: isVideoMode ? "" : (v.meta_description ?? ""),
      agentSlug: v.agent_slug ?? "",
    });
    setFaq(isVideoMode ? [] : (v.faq ?? []));
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

  async function handleCoverUpload(file: File) {
    setCoverUploading(true);
    setUploadProgress("Uploading cover…");
    setError(null);

    try {
      const url = await uploadPlaybookArticleImage(file);
      setForm((f) => ({ ...f, thumbnail: url }));
      setUploadProgress("✓ Cover uploaded");
    } catch (err) {
      setError(`Cover upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setUploadProgress(null);
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleThumbUpload(file: File) {
    setUploading(true);
    setUploadProgress("Uploading thumbnail…");
    setError(null);

    try {
      const url = await uploadPlaybookThumbnail(file);
      setForm((f) => ({ ...f, thumbnail: url }));
      setUploadProgress("✓ Thumbnail uploaded");
    } catch (err) {
      setError(`Thumbnail upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadProgress("Uploading…");
    setError(null);

    try {
      const videoUrl = await uploadPlaybookVideoFile(file);
      setForm((f) => ({ ...f, video_url: videoUrl }));

      setUploadProgress("Generating thumbnail…");
      const poster = await capturePoster(file);
      if (poster) {
        const posterFile = new File([poster], "thumbnail.jpg", { type: "image/jpeg" });
        const thumbUrl = await uploadPlaybookThumbnail(posterFile);
        setForm((f) => ({ ...f, thumbnail: f.thumbnail || thumbUrl }));
      }

      setUploadProgress("✓ Uploaded");
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }

    const hasArticle = Boolean(form.article.trim());
    const hasVideo = Boolean(form.video_url.trim());

    if (mode === "article" && !hasArticle) {
      setError("Article body is required.");
      return;
    }
    if (mode === "video" && !hasVideo) {
      setError("Add a video link or upload a file.");
      return;
    }
    if (!form.topic || !PLAYBOOK_TOPICS.includes(form.topic as PlaybookTopic)) {
      setError("Choose a playbook section (Sell/Upgrade, Buy Tips, or Insights).");
      return;
    }

    setSaving(true);
    setError(null);

    const isSheetCatalogue = Boolean(editId && isSheetCatalogueAdminId(editId));
    const resolvedVideoThumbnail =
      mode === "video"
        ? resolveThumbnail(form.thumbnail.trim(), form.video_url.trim())
        : "";

    const payload = {
      slug: isSheetCatalogue ? editingSlug : editId ? undefined : slugify(form.title),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      topic: form.topic as PlaybookTopic,
      duration: mode === "video" ? form.duration.trim() : "",
      thumbnail:
        mode === "video"
          ? form.thumbnail.trim() || resolvedVideoThumbnail
          : form.thumbnail.trim(),
      video_url: mode === "video" ? form.video_url.trim() : "",
      featured: form.featured,
      published_at: form.published_at,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      article: mode === "article" ? form.article : "",
      meta_description: mode === "article" ? form.meta_description.trim() : "",
      faq: mode === "article"
        ? faq.map((item) => ({ q: item.q.trim(), a: item.a.trim() })).filter((item) => item.q && item.a)
        : [],
      agent_slug: form.agentSlug || null,
      updated_at: new Date().toISOString(),
    };

    if (editId && !isSheetCatalogue) {
      const { error: dbError } = await supabase
        .from("playbook_videos")
        .update(payload)
        .eq("id", editId);
      if (dbError) { setError(dbError.message); setSaving(false); return; }
    } else {
      const { error: dbError } = await supabase
        .from("playbook_videos")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        });
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
      const res = await fetch("/api/admin/playbook/revalidate", { method: "POST" });
      if (!res.ok) {
        console.error("[PlaybookTab] revalidation failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("[PlaybookTab] revalidation network error:", err);
    }
  }

  async function handleDelete(v: Video) {
    if (isSheetCatalogueAdminId(v.id)) {
      setError(
        "This video is in the live catalogue only. Click “Import live videos” to save it to the database first.",
      );
      return;
    }
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    setDeleting(v.id);
    setError(null);

    try {
      const response = await fetch("/api/admin/playbook", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: v.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Could not delete this guide.");
      }

      if (editId === v.id) {
        setShowForm(false);
        setEditId(null);
      }

      await revalidatePlaybook();
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this guide.");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Playbook</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-neutral-900">
            {isVideoMode ? "Videos" : "Articles"}
          </h1>
          <p className="mt-1 text-sm font-normal text-neutral-500">
            {isVideoMode
              ? catalogueCount > 0
                ? `${stats.total} videos shown (${catalogueCount} from live site, not yet in database).`
                : "Short-form vertical videos — grouped under their section on /playbook."
              : "Long-form written guides — shown on /playbook and /playbook/[slug]."}
          </p>
        </div>
        {!showForm && (
          <div className="flex shrink-0 flex-wrap gap-2 self-start">
            {isVideoMode && catalogueCount > 0 && (
              <Button
                type="button"
                variant="outline"
                disabled={syncing}
                onClick={() => void syncSheetVideos()}
                className="flex items-center gap-2"
              >
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import live videos ({catalogueCount})
              </Button>
            )}
            <Button onClick={openAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {isVideoMode ? "Add video" : "Add article"}
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {!showForm && stats.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          {[
            { label: isVideoMode ? "Total videos" : "Total articles", value: stats.total },
            { label: "Featured", value: stats.featured },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">{label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-neutral-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* List errors (form shows its own inline error) */}
      {error && !showForm && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <X className="h-4 w-4 shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-xs font-semibold text-red-600 hover:underline"
          >
            Dismiss
          </button>
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
                {editId ? "Editing" : "New"}
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-neutral-900">
                {editId
                  ? isVideoMode ? "Edit video" : "Edit article"
                  : isVideoMode ? "Add video" : "Add article"}
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
            <FormSection
              title="Basics"
              description={
                isVideoMode
                  ? "One-line title shown under the vertical video on /playbook."
                  : "Headline and card hook for the public article pages."
              }
            >
            <div>
              <FieldLabel required>{isVideoMode ? "One-line video title" : "Title"}</FieldLabel>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={
                  isVideoMode
                    ? "e.g. When is 99-year lease better than freehold?"
                    : "e.g. How We Saved a Seller $32,000 in Commission"
                }
                className={inputClass}
                required
              />
            </div>

            {!isVideoMode && (
            <div>
              <FieldLabel>Card hook / description</FieldLabel>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="Short hook shown on article cards..."
                className={inputClass}
              />
            </div>
            )}
            </FormSection>

            <FormSection title="Placement" description="Section, category, tags, and publish settings.">
            {/* Playbook section */}
            <div>
              <FieldLabel required>Playbook section</FieldLabel>
              <p className="mb-2 text-xs font-normal text-neutral-500">
                {isVideoMode
                  ? "Videos appear under their playbook section on /playbook."
                  : "Articles appear under their playbook section on /playbook and at /playbook/[slug]."}
              </p>
              <div className="flex flex-wrap gap-2">
                {PLAYBOOK_TOPICS.map((t) => (
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

            {/* Author */}
            {!isVideoMode && (
              <div>
                <FieldLabel>Author</FieldLabel>
                <select
                  value={form.agentSlug}
                  onChange={(e) => set("agentSlug", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Auto-detect from video/title</option>
                  {AGENT_OPTIONS.map((agent) => (
                    <option key={agent.slug} value={agent.slug}>{agent.name}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs font-normal text-neutral-500">
                  Shown as the byline on the article page. Leave on auto-detect to keep guessing
                  from the video link, title, and tags.
                </p>
              </div>
            )}

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

            {!isVideoMode && (
            <FormSection
              title="Article & SEO"
              description="Written guide for search and the public /playbook/[slug] page."
            >
              <div>
                <FieldLabel>Cover image</FieldLabel>
                <p className="mb-2 text-xs font-normal text-neutral-500">
                  16:9 thumbnail for cards and the article hero. Upload a PNG/JPG or paste a URL.
                </p>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleCoverUpload(file);
                    e.target.value = "";
                  }}
                />
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={coverUploading || saving}
                    onClick={() => coverFileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    {coverUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload cover
                  </Button>
                </div>
                <input
                  type="url"
                  value={form.thumbnail}
                  onChange={(e) => set("thumbnail", e.target.value)}
                  placeholder="https://… or leave blank to use a designed thumbnail by slug"
                  className={inputClass}
                />
                {(form.thumbnail || form.title) && (
                  <img
                    src={
                      form.thumbnail.trim() ||
                      resolveArticleThumbnail({
                        slug: editingSlug || "preview",
                        title: form.title,
                        thumbnail: form.thumbnail,
                      })
                    }
                    alt=""
                    className="mt-3 aspect-video w-full max-w-md rounded-lg border border-neutral-200 bg-neutral-950 object-contain object-center"
                  />
                )}
              </div>

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
            )}

            {isVideoMode && (
              <FormSection title="Video" description="9:16 vertical clip — YouTube/TikTok link or uploaded MP4.">
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
                      const thumb = resolveThumbnail("", url);
                      setForm((f) => ({ ...f, video_url: url, thumbnail: f.thumbnail || thumb }));
                    }}
                    placeholder="https://www.youtube.com/shorts/…, TikTok, or Vimeo URL"
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
                  <FieldLabel>Thumbnail</FieldLabel>
                  <input
                    ref={thumbFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleThumbUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading || saving}
                      onClick={() => thumbFileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      {uploading && uploadProgress?.includes("thumbnail") ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload image
                    </Button>
                  </div>
                  <input
                    type="url"
                    value={form.thumbnail}
                    onChange={(e) => set("thumbnail", e.target.value)}
                    placeholder="Auto-filled from YouTube/TikTok link, or paste a custom URL"
                    className={inputClass}
                  />
                  {(form.thumbnail || form.video_url) && (
                    <img
                      src={resolveThumbnail(form.thumbnail, form.video_url)}
                      alt=""
                      className="mt-2 aspect-[9/16] w-full max-w-[180px] rounded-lg border border-neutral-200 bg-neutral-950 object-contain object-center"
                    />
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
      {stats.total === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
          {isVideoMode ? (
            <Layers className="mx-auto h-10 w-10 text-neutral-300" />
          ) : (
            <BookOpen className="mx-auto h-10 w-10 text-neutral-300" />
          )}
          <p className="mt-4 text-sm font-semibold text-neutral-700">
            No {isVideoMode ? "videos" : "articles"} yet
          </p>
          <p className="mt-1 text-sm font-normal text-neutral-500">
            {isVideoMode
              ? "Add short vertical videos with a one-line title."
              : "Add your first written guide for the public playbook."}
          </p>
          <Button onClick={openAdd} className="mt-6">
            {isVideoMode ? "Add your first video" : "Add your first article"}
          </Button>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white py-12 text-center">
          <p className="text-sm font-semibold text-neutral-700">No guides match your search</p>
          <button type="button" onClick={() => { setSearchQuery(""); setTopicFilter("all"); }} className="mt-2 text-sm font-semibold text-primary-600 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className={cn("grid gap-4", isVideoMode ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-3")}>
          {filteredVideos.map((v) => {
            const slug = v.slug?.trim();
            const previewHref = isVideoMode
              ? slug
                ? `/playbook/watch/${slug}`
                : "/playbook"
              : slug
                ? `/playbook/${slug}`
                : null;
            const cardImageSrc = isVideoMode
              ? resolveVideoThumbnailCandidatesForDisplay(v.thumbnail, v.video_url)[0] ?? ""
              : resolveArticleThumbnail({
                  slug: v.slug,
                  title: v.title,
                  thumbnail: v.thumbnail,
                });

            return (
              <article
                key={v.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:border-primary-200 hover:shadow-md"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(v)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEdit(v);
                    }
                  }}
                  className="flex cursor-pointer flex-1 flex-col touch-manipulation"
                >
                  <div className={cn("relative bg-neutral-950", isVideoMode ? "aspect-[9/16]" : "aspect-video")}>
                    {cardImageSrc ? (
                      <img
                        src={cardImageSrc}
                        alt=""
                        className="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {isVideoMode ? (
                          <Layers className="h-8 w-8 text-neutral-300" />
                        ) : (
                          <FileText className="h-8 w-8 text-neutral-300" />
                        )}
                      </div>
                    )}
                    {v.featured && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </span>
                    )}
                    {v.sheetCatalogue && (
                      <span className="absolute right-2 top-2 rounded-md bg-neutral-900/85 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Live catalogue
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                        {CATEGORY_LABELS[v.category]}
                      </span>
                      {v.topic && (
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1", TOPIC_BADGE[v.topic])}>
                          {TOPIC_LABELS[v.topic]}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-base font-bold leading-snug text-neutral-900 line-clamp-3 group-hover:text-primary-700">
                      {v.title}
                    </h3>

                    {!isVideoMode && v.description?.trim() && (
                      <p className="mt-2 line-clamp-2 text-sm font-normal leading-relaxed text-neutral-500">
                        {v.description}
                      </p>
                    )}

                    <p className="mt-3 text-xs font-semibold text-primary-600">
                      Tap to edit →
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3">
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
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(v)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(v);
                      }}
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
