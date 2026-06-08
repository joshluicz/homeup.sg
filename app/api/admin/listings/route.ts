import { requireAuth } from "@/lib/supabase/auth";
import { formDataToDbPayload, validateListingForm } from "@/lib/listings/validation";
import type { ListingFormData } from "@/lib/listings/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const body = (await request.json()) as {
    data: ListingFormData;
    action: "draft" | "publish";
    id?: string;
  };

  const validationError = validateListingForm(body.data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const status = body.action === "publish" ? "active" : "draft";
  const payload = formDataToDbPayload(body.data, status);

  const insertPayload = body.id ? { ...payload, id: body.id } : payload;

  const { data, error: dbError } = await supabase
    .from("listings")
    .insert(insertPayload)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ listing: data }, { status: 201 });
}
