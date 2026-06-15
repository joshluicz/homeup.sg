import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchOEmbed(url: string): Promise<{ title?: string; description?: string; thumbnail_url?: string; author_name?: string } | null> {
  try {
    // YouTube oEmbed
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (res.ok) return res.json();
    }
    // Vimeo oEmbed
    if (url.includes("vimeo.com")) {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
      if (res.ok) return res.json();
    }
  } catch {}
  return null;
}

function extractYouTubeThumbnail(url: string): string {
  try {
    const u = new URL(url);
    let id = u.searchParams.get("v");
    if (!id && u.hostname === "youtu.be") id = u.pathname.slice(1);
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  } catch {}
  return "";
}

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const oembed = await fetchOEmbed(url);
  const thumbnail = oembed?.thumbnail_url || extractYouTubeThumbnail(url) || "";

  const context = oembed
    ? `Video title from platform: "${oembed.title}"\nChannel/Author: "${oembed.author_name ?? ""}"`
    : `Video URL: ${url}`;

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are writing copy for HomeUP, a Singapore fixed-fee property agency website.

${context}

Write a short punchy title (max 10 words) and a 1–2 sentence description (max 35 words) for this video to appear on HomeUP's Playbook page. The tone is direct, trustworthy, and benefit-focused for Singapore homeowners.

Reply with valid JSON only:
{"title": "...", "description": "..."}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return NextResponse.json({ title: parsed.title, description: parsed.description, thumbnail });
  } catch {
    return NextResponse.json({ error: "AI response could not be parsed", raw }, { status: 500 });
  }
}
