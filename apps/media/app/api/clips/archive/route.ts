import { NextResponse } from "next/server";
import { archiveRemoteFileToR2, isValidR2Key } from "@/lib/r2";
import { requireAuth } from "@/lib/supabase/auth";
import {
  isValidWebhookSecret,
} from "@/lib/webhook-auth";

type ArchiveBody = {
  source_url?: string;
  r2_key?: string;
};

export async function POST(request: Request) {
  if (!isValidWebhookSecret(request)) {
    const { error } = await requireAuth();
    if (error) return error;
  }

  let body: ArchiveBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { source_url, r2_key } = body;
  if (!source_url || !r2_key) {
    return NextResponse.json(
      { error: "Missing source_url or r2_key" },
      { status: 400 },
    );
  }

  if (!isValidR2Key(r2_key)) {
    return NextResponse.json({ error: "Invalid r2_key" }, { status: 400 });
  }

  try {
    const archived = await archiveRemoteFileToR2(source_url, r2_key);
    return NextResponse.json(archived);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Archive failed";
    console.error("clip archive failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
