import { notFound } from "next/navigation";
import { PlaybookForm } from "@/components/admin/PlaybookForm";
import { getPlaybookVideoBySlug } from "@/lib/playbook/queries";
import { createClient } from "@/lib/supabase/server";

export default async function EditPlaybookVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("playbook_videos").select("*").eq("id", id).single();
  if (!data) notFound();

  const video = {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    category: data.category,
    duration: data.duration,
    thumbnail: data.thumbnail,
    videoUrl: data.video_url,
    featured: data.featured,
    publishedAt: data.published_at,
    tags: data.tags,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-neutral-900">Edit video</h1>
      <PlaybookForm video={video} />
    </div>
  );
}
