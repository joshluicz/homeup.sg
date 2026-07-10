"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { AGENTS } from "@/lib/data/agents";
import type { AgentProfileVideoRow } from "@/lib/agents/profile-videos";
import { AGENT_VIDEO_CATEGORIES } from "@/lib/agents/profile-videos";
import type { AgentVideoCategory } from "@/lib/agents/profile-videos";
import { SITE_URL } from "@/lib/seo/constants";
import { getVideoPlatform } from "@/lib/playbook/embed";
import { resolveVideoThumbnailCandidatesForDisplay } from "@/lib/playbook/embed";
import { cn } from "@/lib/utils";

type VideoRow = AgentProfileVideoRow;

// ─── Category helpers ──────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<AgentVideoCategory, string> = {
  home_tour: "bg-violet-100 text-violet-900 ring-violet-300",
  property_tips: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  landed: "bg-amber-100 text-amber-900 ring-amber-300",
  others: "bg-neutral-100 text-neutral-700 ring-neutral-300",
};

function CategoryBadge({ category }: { category: AgentVideoCategory | null }) {
  const cat = category ?? "others";
  const label = AGENT_VIDEO_CATEGORIES.find((c) => c.value === cat)?.label ?? "Others";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
        CATEGORY_COLORS[cat],
      )}
    >
      {label}
    </span>
  );
}

function CategorySelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: AgentVideoCategory;
  onChange: (v: AgentVideoCategory) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as AgentVideoCategory)}
      className={cn(
        "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-50",
        className,
      )}
    >
      {AGENT_VIDEO_CATEGORIES.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}

// ─── Display badges ────────────────────────────────────────────────────────

function DisplayBadge({ variant }: { variant: "a" | "b" }) {
  if (variant === "b") {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-900 ring-1 ring-sky-300">
        Display B
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-300">
      Display A
    </span>
  );
}

function DisplayPlacementPicker({
  featuredInDisplayA,
  featuredInDisplayB,
  onChangeA,
  onChangeB,
  disabled,
}: {
  featuredInDisplayA: boolean;
  featuredInDisplayB: boolean;
  onChangeA: (value: boolean) => void;
  onChangeB: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-4 rounded-xl border-2 border-neutral-200 bg-neutral-50 p-4">
      <p className="text-sm font-bold text-neutral-900">Where should this video appear?</p>
      <p className="mt-1 text-xs text-neutral-600">
        Both are optional — pick <strong>Display B</strong> to show it on this agent&apos;s
        profile, <strong>Display A</strong> to also include it in the Playbook top strip, either,
        neither, or both.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeB(!featuredInDisplayB)}
          className={cn(
            "flex items-center gap-3 rounded-lg border-2 px-3 py-3 text-left transition",
            featuredInDisplayB
              ? "border-sky-400 bg-sky-50 ring-2 ring-sky-200"
              : "border-neutral-200 bg-white hover:border-sky-300 hover:bg-sky-50/60",
          )}
        >
          <Star
            className={cn(
              "h-5 w-5 shrink-0",
              featuredInDisplayB ? "fill-sky-500 text-sky-600" : "text-neutral-400",
            )}
          />
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-900">
              Agent profile
              {featuredInDisplayB ? <DisplayBadge variant="b" /> : null}
            </p>
            <p className="text-xs text-neutral-600">
              {featuredInDisplayB ? "Display B is ON — click to turn off" : "Display B off — click to turn on"}
            </p>
          </div>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeA(!featuredInDisplayA)}
          className={cn(
            "flex items-center gap-3 rounded-lg border-2 px-3 py-3 text-left transition",
            featuredInDisplayA
              ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
              : "border-neutral-200 bg-white hover:border-amber-300 hover:bg-amber-50/60",
          )}
        >
          <Star
            className={cn(
              "h-5 w-5 shrink-0",
              featuredInDisplayA ? "fill-amber-500 text-amber-600" : "text-neutral-400",
            )}
          />
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-900">
              Playbook top strip
              {featuredInDisplayA ? <DisplayBadge variant="a" /> : null}
            </p>
            <p className="text-xs text-neutral-600">
              {featuredInDisplayA ? "Display A is ON — click to turn off" : "Display A off — click to turn on"}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Form defaults ─────────────────────────────────────────────────────────

const emptyForm = {
  title: "",
  videoUrl: "",
  slug: "",
  featuredInDisplayA: false,
  featuredInDisplayB: false,
  category: "others" as AgentVideoCategory,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function watchUrl(slug: string): string {
  return `${SITE_URL}/playbook/watch/${slug}`;
}

function validateVideoUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "Video URL is required.";
  const platform = getVideoPlatform(trimmed);
  if (platform !== "tiktok" && platform !== "youtube") {
    return "Use a TikTok or YouTube link (watch, Shorts, or tiktok.com/@handle/video/…).";
  }
  return null;
}

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
        <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
        {description && (
          <p className="mt-1 text-xs font-normal text-neutral-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ─── Display filter type ───────────────────────────────────────────────────

type DisplayFilter = "all" | "display_a" | "display_b";

// ─── Main component ────────────────────────────────────────────────────────

export function AgentVideosTab() {
  const [agentSlug, setAgentSlug] = useState(AGENTS[0]?.slug ?? "dennis-lim");
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    videoUrl: "",
    slug: "",
    featuredInDisplayA: false,
    featuredInDisplayB: false,
    category: "others" as AgentVideoCategory,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Search & filter state ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AgentVideoCategory | "all">("all");
  const [displayFilter, setDisplayFilter] = useState<DisplayFilter>("all");

  const agent = useMemo(
    () => AGENTS.find((entry) => entry.slug === agentSlug),
    [agentSlug],
  );
  const agentName = agent?.name ?? agentSlug;
  const agentFirstName = agent?.name.split(" ")[0] ?? agentName;
  const profileUrl = `${SITE_URL}/agents/${agentSlug}`;

  // ── Filtered video list (client-side) ────────────────────────────────────
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((video) => {
      if (q) {
        const inTitle = video.title.toLowerCase().includes(q);
        const inUrl = video.video_url.toLowerCase().includes(q);
        if (!inTitle && !inUrl) return false;
      }
      if (categoryFilter !== "all") {
        const cat = video.category ?? "others";
        if (cat !== categoryFilter) return false;
      }
      if (displayFilter === "display_a" && !video.featured_in_display_a) return false;
      if (displayFilter === "display_b" && !video.featured_in_display_b) return false;
      return true;
    });
  }, [videos, searchQuery, categoryFilter, displayFilter]);

  const isFiltered = searchQuery.trim() !== "" || categoryFilter !== "all" || displayFilter !== "all";

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/agent-videos?agent_slug=${encodeURIComponent(agentSlug)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load videos");
      setVideos(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load videos";
      if (message.includes("agent_profile_videos") && message.includes("schema cache")) {
        setError(
          "The agent_profile_videos table is not set up yet. Run the SQL migration in Supabase Dashboard (see supabase/migrations/20250624000000_agent_profile_videos.sql), then run: node scripts/seed-agent-profile-videos.mjs",
        );
      } else {
        setError(message);
      }
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [agentSlug]);

  useEffect(() => {
    loadVideos();
    setEditingId(null);
    setForm(emptyForm);
    setSearchQuery("");
    setCategoryFilter("all");
    setDisplayFilter("all");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentSlug]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(timer);
  }, [success]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const urlError = validateVideoUrl(form.videoUrl);
    if (urlError) {
      setError(urlError);
      setSaving(false);
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/agent-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug,
          title: form.title.trim(),
          videoUrl: form.videoUrl.trim(),
          slug: form.slug.trim(),
          featuredInDisplayA: form.featuredInDisplayA,
          featuredInDisplayB: form.featuredInDisplayB,
          category: form.category,
          sortOrder: videos.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add video");
      setForm(emptyForm);
      setSuccess(`Added for ${agentFirstName}. Changes are live on the website.`);
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(video: VideoRow) {
    setEditingId(video.id);
    setEditForm({
      title: video.title,
      videoUrl: video.video_url,
      slug: video.slug ?? "",
      featuredInDisplayA: video.featured_in_display_a,
      featuredInDisplayB: video.featured_in_display_b,
      category: (video.category as AgentVideoCategory) ?? "others",
    });
    setError(null);
  }

  async function copyLink(video: VideoRow) {
    if (!video.slug) return;
    try {
      await navigator.clipboard.writeText(watchUrl(video.slug));
      setCopiedId(video.id);
      window.setTimeout(() => setCopiedId((current) => (current === video.id ? null : current)), 1800);
    } catch {
      setError("Couldn't copy the link — copy it manually from the field below.");
    }
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setError(null);

    const urlError = validateVideoUrl(editForm.videoUrl);
    if (urlError) {
      setError(urlError);
      setSaving(false);
      return;
    }
    if (!editForm.title.trim()) {
      setError("Title is required.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/agent-videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: editForm.title.trim(),
          videoUrl: editForm.videoUrl.trim(),
          slug: editForm.slug.trim(),
          featuredInDisplayA: editForm.featuredInDisplayA,
          featuredInDisplayB: editForm.featuredInDisplayB,
          category: editForm.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update video");
      setEditingId(null);
      setSuccess("Video updated on the live profile.");
      setVideos((rows) => rows.map((row) => (row.id === id ? (data as VideoRow) : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update video");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDisplayA(video: VideoRow) {
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: video.id,
          featuredInDisplayA: !video.featured_in_display_a,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update video");
      setVideos((rows) =>
        rows.map((row) => (row.id === video.id ? (data as VideoRow) : row)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update video");
    }
  }

  async function toggleDisplayB(video: VideoRow) {
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: video.id,
          featuredInDisplayB: !video.featured_in_display_b,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update video");
      setVideos((rows) =>
        rows.map((row) => (row.id === video.id ? (data as VideoRow) : row)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update video");
    }
  }

  async function moveVideo(index: number, direction: -1 | 1) {
    // Moving uses the global (unfiltered) index so order stays stable
    const globalIndex = videos.indexOf(filteredVideos[index]!);
    const globalTarget = videos.indexOf(filteredVideos[index + direction]!);
    if (globalIndex < 0 || globalTarget < 0) return;

    const current = videos[globalIndex];
    const target = videos[globalTarget];
    if (!current || !target) return;

    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        fetch("/api/admin/agent-videos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: current.id, sortOrder: target.sort_order }),
        }),
        fetch("/api/admin/agent-videos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: target.id, sortOrder: current.sort_order }),
        }),
      ]);

      if (!resA.ok || !resB.ok) throw new Error("Failed to reorder videos");
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder videos");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this video from the agent profile on the website?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/agent-videos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete video");
      setVideos((rows) => rows.filter((row) => row.id !== id));
      setSuccess("Video removed from the live profile.");
      if (editingId === id) setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setDisplayFilter("all");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
            Agent profile videos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Add a video and choose where it shows: <strong>Display B</strong> (the video rail on
            that agent&apos;s profile page), <strong>Display A</strong> (the Playbook top
            auto-scrolling strip), either, neither, or both.
          </p>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition hover:border-primary-200 hover:bg-primary-50"
        >
          Preview {agentFirstName}&apos;s profile
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="rounded-xl border-2 border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-bold text-neutral-900">Display A vs Display B</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
            <DisplayBadge variant="b" />
            <p className="mt-2 text-sm font-semibold text-neutral-900">Display B — agent profile</p>
            <p className="mt-1 text-xs text-neutral-600">
              Optional. Turn this on to show the video on that agent&apos;s public profile page.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <DisplayBadge variant="a" />
            <p className="mt-2 text-sm font-semibold text-neutral-900">Display A — Playbook top rail</p>
            <p className="mt-1 text-xs text-neutral-600">
              Optional. Turn this on to include the video in the Playbook auto-scrolling strip.
            </p>
          </div>
        </div>
      </div>

      <FormSection
        title="Choose agent"
        description="Each agent manages their own video list. Select who you are editing."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((entry) => {
            const selected = entry.slug === agentSlug;
            return (
              <button
                key={entry.slug}
                type="button"
                onClick={() => setAgentSlug(entry.slug)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  selected
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-100"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
                )}
              >
                <Image
                  src={entry.photo}
                  alt={entry.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-full object-cover object-[center_5px] ring-2 ring-white"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900">{entry.name}</p>
                  <p className="truncate text-xs text-neutral-500">/agents/{entry.slug}</p>
                </div>
              </button>
            );
          })}
        </div>
      </FormSection>

      <form onSubmit={handleAdd}>
        <FormSection
          title={`Add a video — ${agentName}`}
          description="Paste a TikTok or YouTube URL, then choose Display A and/or Display B below."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="e.g. Freehold terrace at Springside Link"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
                TikTok / YouTube URL <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.videoUrl}
                onChange={(e) => setForm((current) => ({ ...current, videoUrl: e.target.value }))}
                placeholder="https://www.tiktok.com/@handle/video/…"
                required
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
                Category
              </label>
              <CategorySelect
                value={form.category}
                onChange={(v) => setForm((current) => ({ ...current, category: v }))}
                disabled={saving}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
                Custom link <span className="font-normal text-neutral-500">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-neutral-500">{SITE_URL}/playbook/watch/</span>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))}
                  placeholder="why-pay-3k-for-condo"
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">
                Leave blank to auto-generate from the title.
              </p>
            </div>
          </div>

          <DisplayPlacementPicker
            featuredInDisplayA={form.featuredInDisplayA}
            featuredInDisplayB={form.featuredInDisplayB}
            onChangeA={(value) => setForm((current) => ({ ...current, featuredInDisplayA: value }))}
            onChangeB={(value) => setForm((current) => ({ ...current, featuredInDisplayB: value }))}
            disabled={saving}
          />

          <div className="mt-5">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add video
                </>
              )}
            </Button>
          </div>
        </FormSection>
      </form>

      {success && (
        <p className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          {success}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ── Video list with search & filters ─────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                {agentName}&apos;s profile videos ({videos.length})
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                <strong>Display B:</strong> shown on this agent&apos;s profile page.{" "}
                <strong>Display A:</strong> shown in the Playbook top rail. Toggle either
                independently per video. Use the arrows to change order.
              </p>
            </div>
          </div>

          {/* Search & filter bar */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${agentFirstName}'s videos by title…`}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-9 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-400 hover:text-neutral-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as AgentVideoCategory | "all")}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:w-44"
            >
              <option value="all">All categories</option>
              {AGENT_VIDEO_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Display filter */}
            <select
              value={displayFilter}
              onChange={(e) => setDisplayFilter(e.target.value as DisplayFilter)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:w-40"
            >
              <option value="all">All displays</option>
              <option value="display_a">Display A on</option>
              <option value="display_b">Display B on</option>
            </select>
          </div>

          {/* Active filters summary */}
          {isFiltered && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-neutral-500">
                Showing {filteredVideos.length} of {videos.length} videos
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-primary-600 hover:bg-primary-50"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="px-5 py-12 text-center">
            {isFiltered ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-neutral-700">No videos match your search</p>
                <p className="text-xs text-neutral-500">
                  Try different keywords or clear the filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                No videos yet for {agentFirstName}. Add a TikTok or YouTube link above, then choose
                whether it shows on their profile (<strong>Display B</strong>), the Playbook top
                strip (<strong>Display A</strong>), either, or both.
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {filteredVideos.map((video, index) => {
              const thumb = resolveVideoThumbnailCandidatesForDisplay(
                video.thumbnail,
                video.video_url,
              )[0];
              const isEditing = editingId === video.id;
              const platform = getVideoPlatform(video.video_url);

              return (
                <li key={video.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
                            Title
                          </label>
                          <Input
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm((current) => ({ ...current, title: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
                            Video URL
                          </label>
                          <Input
                            value={editForm.videoUrl}
                            onChange={(e) =>
                              setEditForm((current) => ({ ...current, videoUrl: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
                            Category
                          </label>
                          <CategorySelect
                            value={editForm.category}
                            onChange={(v) =>
                              setEditForm((current) => ({ ...current, category: v }))
                            }
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
                            Custom link
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-sm text-neutral-500">
                              {SITE_URL}/playbook/watch/
                            </span>
                            <Input
                              value={editForm.slug}
                              onChange={(e) =>
                                setEditForm((current) => ({ ...current, slug: e.target.value }))
                              }
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-neutral-500">
                            Changing this breaks any copy of the old link you&apos;ve already sent out.
                          </p>
                        </div>
                      </div>
                      <DisplayPlacementPicker
                        featuredInDisplayA={editForm.featuredInDisplayA}
                        featuredInDisplayB={editForm.featuredInDisplayB}
                        onChangeA={(value) =>
                          setEditForm((current) => ({ ...current, featuredInDisplayA: value }))
                        }
                        onChangeB={(value) =>
                          setEditForm((current) => ({ ...current, featuredInDisplayB: value }))
                        }
                        disabled={saving}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" disabled={saving} onClick={() => saveEdit(video.id)}>
                          Save changes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-200">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase text-neutral-400">
                              {platform === "youtube" ? "YouTube" : "TikTok"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900">{video.title}</p>
                          <a
                            href={video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 break-all text-xs text-primary-600 hover:underline"
                          >
                            {video.video_url}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          {video.slug && (
                            <button
                              type="button"
                              onClick={() => copyLink(video)}
                              className={cn(
                                "mt-1.5 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-semibold transition",
                                copiedId === video.id
                                  ? "text-primary-700"
                                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                              )}
                              title={watchUrl(video.slug)}
                            >
                              {copiedId === video.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy shareable link
                                </>
                              )}
                            </button>
                          )}
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <CategoryBadge category={(video.category as AgentVideoCategory) ?? "others"} />
                            {video.featured_in_display_b ? (
                              <DisplayBadge variant="b" />
                            ) : (
                              <span className="text-xs font-medium text-neutral-500">Display B off</span>
                            )}
                            {video.featured_in_display_a ? (
                              <DisplayBadge variant="a" />
                            ) : (
                              <span className="text-xs font-medium text-neutral-500">Display A off</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[280px]">
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                            Agent profile
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleDisplayB(video)}
                            className={cn(
                              "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ring-1 transition",
                              video.featured_in_display_b
                                ? "bg-sky-100 text-sky-950 ring-sky-300 hover:bg-sky-200"
                                : "bg-white text-neutral-700 ring-neutral-300 hover:bg-neutral-100",
                            )}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                video.featured_in_display_b && "fill-sky-500 text-sky-600",
                              )}
                            />
                            {video.featured_in_display_b ? "Display B on" : "Display B off"}
                          </button>
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                            Playbook strip
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleDisplayA(video)}
                            className={cn(
                              "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ring-1 transition",
                              video.featured_in_display_a
                                ? "bg-amber-100 text-amber-950 ring-amber-300 hover:bg-amber-200"
                                : "bg-white text-neutral-700 ring-neutral-300 hover:bg-neutral-100",
                            )}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                video.featured_in_display_a && "fill-amber-500 text-amber-600",
                              )}
                            />
                            {video.featured_in_display_a ? "Display A on" : "Display A off"}
                          </button>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveVideo(index, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                            className="rounded-lg border border-neutral-200 p-2 text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveVideo(index, 1)}
                            disabled={index === filteredVideos.length - 1}
                            aria-label="Move down"
                            className="rounded-lg border border-neutral-200 p-2 text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(video)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(video.id)}
                          className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        Tip: after saving, open the preview link above to confirm videos appear under{" "}
        <strong>Property insights — Tips from {agentFirstName}</strong> on the public site.
      </p>
    </div>
  );
}
