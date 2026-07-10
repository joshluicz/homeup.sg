import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { AGENTS, getAgentBySlug } from "@/lib/data/agents";
import { fetchOEmbedThumbnail } from "@/lib/playbook/oembed";
import { slugify, uniqueSlug } from "@/lib/playbook/slugify";
import { PLAYBOOK_SHEET_VIDEOS } from "@/lib/data/playbook-sheet-videos";
import type { SupabaseClient } from "@supabase/supabase-js";

function revalidateAgent(agentSlug: string) {
  revalidatePath("/agents");
  revalidatePath(`/agents/${agentSlug}`);
  revalidatePath("/playbook", "layout");
}

/** Collisions across every place a /playbook/watch/[slug] page can come from. */
async function takenSlugs(
  supabase: SupabaseClient,
  excludeId?: string,
): Promise<Set<string>> {
  const [{ data: agentRows }, { data: playbookRows }] = await Promise.all([
    supabase.from("agent_profile_videos").select("id, slug"),
    supabase.from("playbook_videos").select("slug"),
  ]);

  const taken = new Set<string>(PLAYBOOK_SHEET_VIDEOS.map((v) => v.slug));
  for (const row of playbookRows ?? []) {
    if (row.slug) taken.add(row.slug as string);
  }
  for (const row of agentRows ?? []) {
    if (row.slug && row.id !== excludeId) taken.add(row.slug as string);
  }
  return taken;
}

export async function GET(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const agentSlug = new URL(request.url).searchParams.get("agent_slug")?.trim();
  if (!agentSlug) {
    return NextResponse.json({ error: "agent_slug is required" }, { status: 400 });
  }

  const { data, error: dbError } = await supabase
    .from("agent_profile_videos")
    .select("*")
    .eq("agent_slug", agentSlug)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const agentSlug = String(body.agentSlug ?? "").trim();
  const title = String(body.title ?? "").trim();
  const videoUrl = String(body.videoUrl ?? "").trim();
  const thumbnail = String(body.thumbnail ?? "").trim();
  const featuredInDisplayA = Boolean(body.featuredInDisplayA);
  const featuredInDisplayB = Boolean(body.featuredInDisplayB);
  const sortOrder = Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0;
  const category = ["home_tour", "property_tips", "landed", "others"].includes(body.category)
    ? String(body.category)
    : "others";

  if (!agentSlug || !getAgentBySlug(agentSlug)) {
    return NextResponse.json({ error: "Choose a valid agent." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!videoUrl) {
    return NextResponse.json({ error: "Video URL is required." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("agent_profile_videos")
    .select("id")
    .eq("agent_slug", agentSlug)
    .eq("video_url", videoUrl)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "A video with this URL already exists for this agent." },
      { status: 409 },
    );
  }

  const resolvedThumbnail = thumbnail || (await fetchOEmbedThumbnail(videoUrl));

  const requestedSlug = slugify(String(body.slug ?? "").trim());
  const taken = await takenSlugs(supabase);
  const slug = uniqueSlug(requestedSlug || slugify(title) || "video", taken);

  const { data, error: dbError } = await supabase
    .from("agent_profile_videos")
    .insert({
      agent_slug: agentSlug,
      title,
      video_url: videoUrl,
      thumbnail: resolvedThumbnail,
      featured_in_display_a: featuredInDisplayA,
      featured_in_display_b: featuredInDisplayB,
      sort_order: sortOrder,
      slug,
      category,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (dbError) {
    if (dbError.message.includes("agent_profile_videos_agent_url_idx")) {
      return NextResponse.json(
        { error: "A video with this URL already exists for this agent." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  revalidateAgent(agentSlug);
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.videoUrl !== undefined) updates.video_url = String(body.videoUrl).trim();
  if (body.thumbnail !== undefined) updates.thumbnail = String(body.thumbnail).trim();
  if (body.featuredInDisplayA !== undefined) {
    updates.featured_in_display_a = Boolean(body.featuredInDisplayA);
  }
  if (body.featuredInDisplayB !== undefined) {
    updates.featured_in_display_b = Boolean(body.featuredInDisplayB);
  }
  if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) {
    updates.sort_order = Number(body.sortOrder);
  }
  if (body.category !== undefined) {
    const cat = String(body.category).trim();
    if (["home_tour", "property_tips", "landed", "others"].includes(cat)) {
      updates.category = cat;
    }
  }
  if (body.slug !== undefined) {
    const requested = slugify(String(body.slug).trim());
    if (!requested) {
      return NextResponse.json({ error: "Link can't be empty." }, { status: 400 });
    }
    const taken = await takenSlugs(supabase, id);
    if (taken.has(requested)) {
      return NextResponse.json(
        { error: "That link is already in use — try something else." },
        { status: 400 },
      );
    }
    updates.slug = requested;
  }

  if (body.videoUrl !== undefined) {
    const newVideoUrl = String(body.videoUrl).trim();
    const { data: currentRow } = await supabase
      .from("agent_profile_videos")
      .select("agent_slug, video_url")
      .eq("id", id)
      .maybeSingle();

    if (currentRow && newVideoUrl !== currentRow.video_url) {
      const { data: urlConflict } = await supabase
        .from("agent_profile_videos")
        .select("id")
        .eq("agent_slug", currentRow.agent_slug)
        .eq("video_url", newVideoUrl)
        .maybeSingle();

      if (urlConflict) {
        return NextResponse.json(
          { error: "A video with this URL already exists for this agent." },
          { status: 409 },
        );
      }
    }

    if (body.thumbnail === undefined) {
      const thumb = await fetchOEmbedThumbnail(newVideoUrl);
      if (thumb) updates.thumbnail = thumb;
    }
  }

  const { data, error: dbError } = await supabase
    .from("agent_profile_videos")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (dbError) {
    if (dbError.message.includes("agent_profile_videos_agent_url_idx")) {
      return NextResponse.json(
        { error: "A video with this URL already exists for this agent." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  revalidateAgent(data.agent_slug);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("agent_profile_videos")
    .select("agent_slug")
    .eq("id", id)
    .maybeSingle();

  const { error: dbError } = await supabase.from("agent_profile_videos").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  if (existing?.agent_slug) revalidateAgent(existing.agent_slug);
  return NextResponse.json({ ok: true });
}
