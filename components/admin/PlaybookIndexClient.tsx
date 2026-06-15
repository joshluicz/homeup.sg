"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABELS } from "@/lib/data/playbook";
import type { PlaybookVideo } from "@/lib/data/playbook";

export function PlaybookIndexClient({ videos }: { videos: PlaybookVideo[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(video: PlaybookVideo) {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    setDeleting(video.id);
    await fetch("/api/admin/playbook", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: video.id }),
    });
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Playbook Videos</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{videos.length} video{videos.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/admin/playbook/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add video
          </Link>
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-sm text-neutral-500">No videos yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/playbook/new">Add your first video</Link>
          </Button>
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
                        {v.videoUrl ? (
                          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                            View video ↗
                          </a>
                        ) : (
                          <span className="text-xs text-neutral-400">No video URL yet</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {CATEGORY_LABELS[v.category]}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{v.duration || "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{v.publishedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/playbook/edit?id=${v.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(v)}
                        disabled={deleting === v.id}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
