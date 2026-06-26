import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Push article + metadata changes live without a redeploy: revalidate the affected
// pages so the ISR-cached /playbook/[slug] (and the listing) regenerate on next request.
function revalidatePlaybook(slug?: string) {
  revalidatePath("/playbook");
  revalidatePath("/playbook/articles");
  revalidatePath("/playbook/videos");
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

  const article = (fields.article ?? "").trim();
  const videoUrl = (fields.videoUrl ?? "").trim();
  const contentKind = fields.contentKind === "video" ? "video" : "article";

  if (contentKind === "article" && videoUrl) {
    return NextResponse.json(
      { error: "Articles cannot include a video. Add the clip under Playbook → Videos instead." },
      { status: 400 },
    );
  }

  if (contentKind === "video" && article) {
    return NextResponse.json(
      { error: "Videos cannot include an article body. Add the written guide under Playbook → Articles instead." },
      { status: 400 },
    );
  }

  if (contentKind === "article" && !article) {
    return NextResponse.json(
      { error: "Article body is required for playbook articles." },
      { status: 400 },
    );
  }

  if (contentKind === "video" && !videoUrl) {
    return NextResponse.json(
      { error: "Video URL or upload is required for playbook videos." },
      { status: 400 },
    );
  }

  const validTopics = ["upgraders", "buying_first", "condo_tips"] as const;
  if (!fields.topic || !validTopics.includes(fields.topic)) {
    return NextResponse.json(
      { error: "Choose a playbook section (Sell/Upgrade, Buy Tips, or Insights)." },
      { status: 400 },
    );
  }

  const payload = {
    slug: fields.slug || slugify(fields.title),
    title: fields.title,
    description: fields.description ?? "",
    category: fields.category,
    duration: contentKind === "video" ? (fields.duration ?? "") : "",
    thumbnail: fields.thumbnail ?? "",
    video_url: contentKind === "video" ? (fields.videoUrl ?? "") : "",
    featured: fields.featured ?? false,
    published_at: fields.publishedAt ?? new Date().toISOString().slice(0, 10),
    tags: fields.tags ?? [],
    article: contentKind === "article" ? (fields.article ?? "") : "",
    faq: contentKind === "article" && Array.isArray(fields.faq)
      ? fields.faq.filter((f: { q?: string; a?: string }) => f?.q && f?.a)
      : [],
    meta_description: contentKind === "article" ? (fields.metaDescription ?? "") : "",
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
