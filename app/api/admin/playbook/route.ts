import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { revalidatePlaybookPaths } from "@/lib/playbook/revalidate-playbook";
import {
  isArticleSections,
  normalizeArticleSections,
  serializeArticleSectionsToMarkdown,
  validateArticleSections,
} from "@/lib/playbook/article-sections";
import {
  buildPlaybookVideoDbPayload,
  writePlaybookVideoRow,
  type PlaybookContentKind,
} from "@/lib/playbook/playbook-db-write";
import { sanitizeArticleSectionsFields, sanitizeDraftFields } from "@/lib/pipeline/cea-terminology";

function revalidatePlaybook(slug?: string, contentKind?: PlaybookContentKind) {
  const slugs = slug && contentKind === "article" ? [slug] : [];
  revalidatePlaybookPaths(slugs);
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
  const contentKind: PlaybookContentKind = fields.contentKind === "video" ? "video" : "article";
  const rawSections = fields.articleSections ?? fields.article_sections;
  let articleSections =
    contentKind === "article" && isArticleSections(rawSections)
      ? normalizeArticleSections(rawSections)
      : null;
  let faqEntries =
    contentKind === "article" && Array.isArray(fields.faq)
      ? fields.faq.filter((f: { q?: string; a?: string }) => f?.q && f?.a)
      : [];
  let serializedArticle =
    contentKind === "article" && articleSections
      ? serializeArticleSectionsToMarkdown(articleSections)
      : article;

  if (contentKind === "article") {
    if (articleSections) {
      articleSections = sanitizeArticleSectionsFields(articleSections);
      serializedArticle = serializeArticleSectionsToMarkdown(articleSections);
    }
    const sanitized = sanitizeDraftFields({
      article: serializedArticle,
      faq: faqEntries,
      description: fields.description ?? "",
      metaDescription: fields.metaDescription ?? "",
    });
    serializedArticle = sanitized.article;
    faqEntries.splice(0, faqEntries.length, ...(sanitized.faq ?? []));
    fields.description = sanitized.description ?? fields.description;
    fields.metaDescription = sanitized.metaDescription ?? fields.metaDescription;
  }

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

  if (contentKind === "article" && !serializedArticle) {
    return NextResponse.json(
      { error: "Article body is required for playbook articles." },
      { status: 400 },
    );
  }

  if (contentKind === "article" && articleSections) {
    const validation = validateArticleSections(articleSections, faqEntries);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
    }
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

  const payload = buildPlaybookVideoDbPayload(
    {
      slug: fields.slug,
      title: fields.title,
      description: fields.description ?? "",
      category: fields.category,
      topic: fields.topic,
      duration: fields.duration,
      thumbnail: fields.thumbnail,
      videoUrl: fields.videoUrl,
      featured: fields.featured,
      publishedAt: fields.publishedAt,
      tags: fields.tags,
      article: serializedArticle,
      articleSections,
      faq: faqEntries,
      metaDescription: fields.metaDescription,
      agentSlug: fields.agentSlug,
      contentKind,
    },
    { slugify },
  );

  const { data, error: dbError } = await writePlaybookVideoRow(supabase, {
    id: id || undefined,
    payload,
  });

  if (dbError) {
    if (dbError.code === "23505") {
      return NextResponse.json({ error: "A video with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const slug = String(data.slug ?? payload.slug);
  revalidatePlaybook(slug, contentKind);
  return NextResponse.json({ video: data }, { status: id ? 200 : 201 });
}

export async function DELETE(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: row } = await supabase
    .from("playbook_videos")
    .select("slug, article, video_url, article_sections")
    .eq("id", id)
    .maybeSingle();

  const { error: dbError } = await supabase.from("playbook_videos").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const wasArticle = Boolean(
    (row?.article as string | null)?.trim() || row?.article_sections != null,
  );
  revalidatePlaybook(row?.slug as string | undefined, wasArticle ? "article" : "video");
  return NextResponse.json({ ok: true });
}
