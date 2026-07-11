import { buildInsightsContext, fetchInsights } from "@/lib/analytics/insights";
import type { DatePreset } from "@/lib/analytics/dateRange";
import { getAnthropicClient, getLlmModel, extractTextContent } from "@/lib/pipeline/llm";
import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the HomeUp site insights analyst — an expert at interpreting web analytics for a Singapore property agency (homeup.sg).

You receive a JSON snapshot of site performance covering:
- Traffic overview (sessions, users, pageviews, engagement, bounce rate)
- Traffic sources, campaigns, devices, countries
- Page performance (top pages, landing pages, playbook articles)
- Conversion events (WhatsApp clicks, form leads, video plays, listing views, article views)
- Per-article metrics (page views, search clicks/impressions, WhatsApp leads)
- Ad readiness signals (playbook engagement, scroll depth, top articles by views)

Rules:
- Answer questions directly and concisely using ONLY the data provided.
- Cite specific numbers from the snapshot. Use Singapore English.
- When comparing periods or trends, reference the daily trend data if available.
- For ad placement questions, focus on playbook article views, avg duration, scroll completion, and engagement rate.
- If data is missing or zero, say so honestly — don't invent figures.
- Format responses with short paragraphs and bullet points where helpful.
- The period label in the data tells you the exact date range — always mention it when relevant.`;

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let question = "";
  let history: { role: "user" | "assistant"; content: string }[] = [];
  let dateInput: { preset?: DatePreset; startIso?: string; endIso?: string; days?: number } = {};

  try {
    const body = (await request.json()) as {
      question?: string;
      history?: { role: "user" | "assistant"; content: string }[];
      preset?: DatePreset;
      startIso?: string;
      endIso?: string;
      days?: number;
    };
    question = (body.question ?? "").trim();
    history = body.history ?? [];
    dateInput = {
      preset: body.preset,
      startIso: body.startIso,
      endIso: body.endIso,
      days: body.days,
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "AI_NOT_CONFIGURED", detail: "Add ANTHROPIC_API_KEY to enable the insights analyst." },
      { status: 503 },
    );
  }

  try {
    const snapshot = await fetchInsights(dateInput);
    if ("error" in snapshot) {
      return NextResponse.json(snapshot, { status: snapshot.error === "GA4_NOT_CONFIGURED" ? 503 : 500 });
    }

    const context = buildInsightsContext(snapshot);
    const client = getAnthropicClient();

    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...history.slice(-6),
      {
        role: "user",
        content: `Site insights data for ${snapshot.dateRange.label}:\n${context}\n\nQuestion: ${question}`,
      },
    ];

    const response = await client.messages.create({
      model: getLlmModel(),
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const answer = extractTextContent(response);

    return NextResponse.json({
      answer,
      period: snapshot.dateRange.label,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "AI_ERROR", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
