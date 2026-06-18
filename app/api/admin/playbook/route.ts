import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Push article + metadata changes live without a redeploy: revalidate the affected
// pages so the ISR-cached /playbook/[slug] (and the listing) regenerate on next request.
function revalidatePlaybook(slug?: string) {
  revalidatePath("/playbook");
  if (slug) revalidatePath(`/playbook/${slug}`);
}

export async function GET() {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { data, error: dbError } = await supabase
    .from("playbook_videos")
    .select("*")
    .order("published_at", { ascending: false });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { id, ...fields } = body;

  const payload = {
    slug: fields.slug || slugify(fields.title),
    title: fields.title,
    description: fields.description ?? "",
    category: fields.category,
    duration: fields.duration ?? "",
    thumbnail: fields.thumbnail ?? "",
    video_url: fields.videoUrl ?? "",
    featured: fields.featured ?? false,
    published_at: fields.publishedAt ?? new Date().toISOString().slice(0, 10),
    tags: fields.tags ?? [],
    article: fields.article ?? "",
    faq: Array.isArray(fields.faq)
      ? fields.faq.filter((f: { q?: string; a?: string }) => f?.q && f?.a)
      : [],
    meta_description: fields.metaDescription ?? "",
    topic: fields.topic ?? null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error: dbError } = await supabase
      .from("playbook_videos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    revalidatePlaybook(payload.slug);
    return NextResponse.json({ video: data });
  }

  const { data, error: dbError } = await supabase
    .from("playbook_videos")
    .insert(payload)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505")
      return NextResponse.json({ error: "A video with this slug already exists" }, { status: 409 });
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  revalidatePlaybook(payload.slug);
  return NextResponse.json({ video: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: row } = await supabase
    .from("playbook_videos")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error: dbError } = await supabase.from("playbook_videos").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  revalidatePlaybook(row?.slug as string | undefined);
  return NextResponse.json({ ok: true });
}
