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
    max_tokens: 2500,
    messages: [
      {
        role: "user",
        content: `You are writing content for HomeUP, a Singapore fixed-fee property agency website (HDB sellers from $1,999, Condo/EC from $4,999, Landed from $9,999).

${context}

Produce a full Playbook entry to publish alongside this video. The audience is Singapore homeowners searching for help buying or selling property. Tone: direct, trustworthy, benefit-focused, plain English. Optimise for SEO and AI answer engines (GEO): answer real questions clearly, use Singapore-specific terms (HDB, BTO, MOP, COV, ABSD, CPF, OTP) where relevant, and lead with the direct answer.

Return ALL of these fields:
- "title": punchy, max 10 words.
- "description": 1–2 sentences, max 35 words (shown on the video card).
- "metaDescription": SEO meta description, max 155 characters, includes the key search phrase.
- "article": a Markdown article of about 450–700 words. Use ## and ### headings, short paragraphs, and bullet lists. Be specific and accurate to Singapore property rules; do NOT invent figures, dates, or legal specifics — keep claims general where unsure. Start with a 1–2 sentence direct answer to the core question.
- "faq": an array of 3–5 objects {"q": "...", "a": "..."} answering the most common related questions. Each answer 1–3 sentences, self-contained.

IMPORTANT: The user will review and edit before publishing, so prefer accurate-but-general over confidently-wrong specifics.

Reply with valid JSON only, no markdown fences:
{"title": "...", "description": "...", "metaDescription": "...", "article": "...", "faq": [{"q": "...", "a": "..."}]}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return NextResponse.json({
      title: parsed.title,
      description: parsed.description,
      metaDescription: parsed.metaDescription ?? "",
      article: parsed.article ?? "",
      faq: Array.isArray(parsed.faq)
        ? parsed.faq.filter((f: { q?: string; a?: string }) => f?.q && f?.a)
        : [],
      thumbnail,
    });
  } catch {
    return NextResponse.json({ error: "AI response could not be parsed", raw }, { status: 500 });
  }
}
