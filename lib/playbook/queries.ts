import { createClient } from "@/lib/supabase/server";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { rowToVideo } from "@/lib/playbook/row-to-video";

export { rowToVideo } from "@/lib/playbook/row-to-video";

export async function getPlaybookVideos(): Promise<PlaybookVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToVideo);
}

export async function getPlaybookVideoBySlug(slug: string): Promise<PlaybookVideo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return rowToVideo(data);
}
