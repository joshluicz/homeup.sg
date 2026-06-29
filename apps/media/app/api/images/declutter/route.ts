import { NextResponse } from "next/server";
import {
  buildCleanedPhotoKey,
  declutterImageToR2,
} from "@/lib/declutter";
import { requireAuth } from "@/lib/supabase/auth";

type DeclutterBody = {
  source_url?: string;
  room_label?: string;
  blueprint_id?: string;
  index?: number;
};

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: DeclutterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { source_url, room_label, blueprint_id, index } = body;
  if (!source_url) {
    return NextResponse.json({ error: "Missing source_url" }, { status: 400 });
  }

  const sessionOrBlueprint = blueprint_id?.trim() || "session";
  const label = room_label?.trim() || "room";
  const photoIndex = typeof index === "number" && index >= 0 ? index : 0;
  const r2Key = buildCleanedPhotoKey(sessionOrBlueprint, label, photoIndex);

  try {
    const result = await declutterImageToR2({
      sourceUrl: source_url,
      r2Key,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Declutter failed";
    console.error("declutter failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
