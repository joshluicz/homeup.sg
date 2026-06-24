import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { upsertSheetVideosToDatabase } from "@/lib/playbook/sync-sheet-videos";

/** Import all live-site sheet videos into playbook_videos so they appear as editable rows in admin. */
export async function POST() {
  const { error } = await requireAuth();
  if (error) return error;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server missing Supabase service role configuration." },
      { status: 500 },
    );
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const result = await upsertSheetVideosToDatabase(supabase);

  revalidatePath("/playbook");
  revalidatePath("/playbook/videos");
  revalidatePath("/playbook/watch/[slug]", "page");

  return NextResponse.json(result);
}
