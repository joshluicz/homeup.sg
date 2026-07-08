import { requireAuth } from "@/lib/supabase/auth";
import { runRadar, makeCustomTopic } from "@/lib/pipeline/radar";
import { NextResponse } from "next/server";

/** GET /api/admin/topics — returns scored radar topic candidates */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const topics = await runRadar();
  return NextResponse.json(topics);
}

/** POST /api/admin/topics — converts a custom user title into a topic candidate */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { title } = await request.json();
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const topic = makeCustomTopic(title);
  return NextResponse.json(topic);
}
