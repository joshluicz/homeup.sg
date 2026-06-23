import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { EMPTY_WEBHOOK_RESPONSE_MESSAGE } from "@/lib/read-response-json";

const N8N_GENERATE_BLUEPRINT_WEBHOOK =
  "https://n8n-production-d50a.up.railway.app/webhook/homeup-generate-blueprint";

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const webhookRes = await fetch(N8N_GENERATE_BLUEPRINT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await webhookRes.text();

    if (!webhookRes.ok) {
      return NextResponse.json(
        { error: text || "Blueprint generation failed" },
        { status: webhookRes.status },
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: EMPTY_WEBHOOK_RESPONSE_MESSAGE },
        { status: 502 },
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(
        { error: `Invalid JSON from workflow: ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("generate-blueprint proxy failed:", err);
    return NextResponse.json(
      { error: "Failed to reach blueprint workflow" },
      { status: 502 },
    );
  }
}
