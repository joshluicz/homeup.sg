"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { AGENTS } from "@/lib/data/agents";
import type { AgentProfileVideoRow } from "@/lib/agents/profile-videos";
import { SITE_URL } from "@/lib/seo/constants";
import { getVideoPlatform } from "@/lib/playbook/embed";
import { resolveVideoThumbnailCandidatesForDisplay } from "@/lib/playbook/embed";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

type VideoRow = AgentProfileVideoRow;

const emptyForm = {
  title: "",
  videoUrl: "",
  featuredInDisplayA: true,
};

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
    featuredInDisplayA: false,
  });

  const agent = useMemo(
    () => AGENTS.find((entry) => entry.slug === agentSlug),
    [agentSlug],
  );
  const agentName = agent?.name ?? agentSlug;
  const agentFirstName = agent?.name.split(" ")[0] ?? agentName;
  const profileUrl = `${SITE_URL}/agents/${agentSlug}`;

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
  }, [loadVideos]);

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
          featuredInDisplayA: form.featuredInDisplayA,
          sortOrder: videos.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add video");
      setForm(emptyForm);
      setSuccess(`Added to ${agentFirstName}'s profile. Changes are live on the website.`);
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
      featuredInDisplayA: video.featured_in_display_a,
    });
    setError(null);
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
          featuredInDisplayA: editForm.featuredInDisplayA,
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

  async function moveVideo(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const current = videos[index];
    const target = videos[targetIndex];
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
            Agent profile videos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Add video links to <strong>Display B</strong> (the video rail on each agent&apos;s
            profile page). Toggle <strong>Display A</strong> to also include selected clips in
            the Playbook top auto-scrolling strip.
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
          title={`Add to Display B — ${agentName}`}
          description="Paste a TikTok or YouTube URL. All new videos appear on the agent profile (Display B)."
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

          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={form.featuredInDisplayA}
              onChange={(e) =>
                setForm((current) => ({ ...current, featuredInDisplayA: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              Also feature in <strong>Display A</strong> (Playbook top auto-scrolling strip)
            </span>
          </label>

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
                  Add to profile
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

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-bold text-neutral-900">
            {agentName}&apos;s profile videos ({videos.length})
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            <strong>Display B:</strong> all videos below show on the agent profile.{" "}
            <strong>Display A:</strong> starred items also appear in the Playbook top rail. Use
            the arrows to change order.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : videos.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-neutral-500">
            No videos yet for {agentFirstName}. Add a TikTok or YouTube link above — it will
            appear in the Property insights section on their profile.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {videos.map((video, index) => {
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
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={editForm.featuredInDisplayA}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              featuredInDisplayA: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        Feature in Display A
                      </label>
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
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-800 ring-1 ring-sky-200">
                              Display B
                            </span>
                            {video.featured_in_display_a ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 ring-1 ring-amber-200">
                                Display A
                              </span>
                            ) : (
                              <span className="text-neutral-500">Display A off</span>
                            )}
                          </p>
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
                            disabled={index === videos.length - 1}
                            aria-label="Move down"
                            className="rounded-lg border border-neutral-200 p-2 text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleDisplayA(video)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                            video.featured_in_display_a
                              ? "bg-amber-50 text-amber-800 ring-amber-200"
                              : "bg-neutral-50 text-neutral-600 ring-neutral-200 hover:bg-neutral-100",
                          )}
                        >
                          <Star
                            className={cn(
                              "h-3.5 w-3.5",
                              video.featured_in_display_a && "fill-amber-500 text-amber-500",
                            )}
                          />
                          {video.featured_in_display_a ? "In Display A" : "Display B only"}
                        </button>
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
