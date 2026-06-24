import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAYBOOK_SHEET_VIDEOS } from "@/lib/data/playbook-sheet-videos";

export async function upsertSheetVideosToDatabase(supabase: SupabaseClient) {
  let upserted = 0;
  const errors: string[] = [];

  for (const video of PLAYBOOK_SHEET_VIDEOS) {
    const payload = {
      slug: video.slug,
      title: video.title,
      description: video.description || video.title,
      category: video.category,
      duration: video.duration || "",
      thumbnail: video.thumbnail?.trim() ?? "",
      video_url: video.videoUrl,
      featured: Boolean(video.featured),
      published_at: video.publishedAt || "2026-01-01",
      tags: video.tags,
      topic: video.topic,
      article: "",
      meta_description: "",
      faq: [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("playbook_videos").upsert(payload, {
      onConflict: "slug",
    });

    if (error) {
      errors.push(`${video.slug}: ${error.message}`);
    } else {
      upserted++;
    }
  }

  return {
    upserted,
    total: PLAYBOOK_SHEET_VIDEOS.length,
    errors,
  };
}
