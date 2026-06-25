"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Star, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { AGENTS } from "@/lib/data/agents";
import type { AgentProfileVideoRow } from "@/lib/agents/profile-videos";
import { resolveVideoThumbnailCandidatesForDisplay } from "@/lib/playbook/embed";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

type VideoRow = AgentProfileVideoRow;

const emptyForm = {
  title: "",
  videoUrl: "",
  featuredInDisplayA: false,
};

export function AgentVideosTab() {
  const [agentSlug, setAgentSlug] = useState(AGENTS[0]?.slug ?? "dennis-lim");
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const agentName = useMemo(
    () => AGENTS.find((agent) => agent.slug === agentSlug)?.name ?? agentSlug,
    [agentSlug],
  );

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/agent-videos?agent_slug=${encodeURIComponent(agentSlug)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load videos");
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [agentSlug]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
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
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video");
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

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this video from the agent profile?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/agent-videos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete video");
      setVideos((rows) => rows.filter((row) => row.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
          Agent profile videos
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Add video links to <strong>Display B</strong> (browse grid) on each agent&apos;s profile
          page. Toggle <strong>Feature in Display A</strong> to include selected clips in the
          slow auto-scrolling strip — same pattern as the Playbook top rail.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <label className="mb-1.5 block text-sm font-semibold text-neutral-900">Agent</label>
        <select
          value={agentSlug}
          onChange={(e) => setAgentSlug(e.target.value)}
          className={cn(inputClass, "max-w-md")}
        >
          {AGENTS.map((agent) => (
            <option key={agent.slug} value={agent.slug}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-bold text-neutral-900">Add to Display B — {agentName}</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Paste a TikTok, YouTube Shorts, or YouTube watch URL.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Should you sell before you buy?"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-900">
              Video URL <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              placeholder="https://www.tiktok.com/@handle/video/..."
              required
            />
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={form.featuredInDisplayA}
            onChange={(e) =>
              setForm((f) => ({ ...f, featuredInDisplayA: e.target.checked }))
            }
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            Feature in <strong>Display A</strong> too (auto-scrolling strip)
          </span>
        </label>

        <div className="mt-5 flex items-center gap-3">
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
      </form>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-bold text-neutral-900">
            {agentName}&apos;s videos ({videos.length})
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Display B shows all videos below. Display A shows only starred items.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : videos.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-neutral-500">
            No videos yet. Add a link above to populate Display B.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {videos.map((video) => {
              const thumb = resolveVideoThumbnailCandidatesForDisplay(
                video.thumbnail,
                video.video_url,
              )[0];

              return (
                <li key={video.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-200">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase text-neutral-400">
                          Video
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">{video.title}</p>
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                      >
                        {video.video_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                      onClick={() => handleDelete(video.id)}
                      className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
