import { createClient } from "@supabase/supabase-js";
import type { PlaybookVideo } from "@/lib/data/playbook";
import { rowToVideo } from "@/lib/playbook/queries";

/** Server/build-time Supabase queries (no cookies). Used by generateStaticParams and the
 *  static-rendered /playbook/[slug] article pages. Mirrors lib/listings/server-queries.ts. */
export async function getAllPlaybookSlugs(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("playbook_videos").select("slug");

  if (error) {
    console.warn("getAllPlaybookSlugs:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.slug as string);
}

export async function getPlaybookVideoBySlugServer(
  slug: string,
): Promise<PlaybookVideo | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("playbook_videos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return rowToVideo(data);
}
