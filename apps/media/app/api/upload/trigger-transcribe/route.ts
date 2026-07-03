import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function POST() {
  const { error } = await requireAuth();
  if (error) return error;

  return NextResponse.json(
    {
      error:
        "Transcription is not implemented yet. Upload jobs are saved but automatic transcription is disabled.",
    },
    { status: 501 },
  );
}
