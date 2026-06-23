import { NextResponse } from "next/server";
import { blueprintFromRow } from "@/lib/blueprint";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = params;

  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("blueprints")
    .select("id, script, shot_list, edit_instructions, notes")
    .eq("id", id)
    .single();

  if (dbError || !data) {
    return NextResponse.json(
      { error: dbError?.message ?? "Blueprint not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(blueprintFromRow(data));
}
