import { requireAuth } from "@/lib/supabase/auth";
import { formDataToDbPayload, validateListingForm } from "@/lib/listings/validation";
import type { ListingFormData } from "@/lib/listings/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const { id } = await context.params;
  const body = (await request.json()) as {
    data: ListingFormData;
    action: "draft" | "publish";
  };

  const validationError = validateListingForm(body.data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const status = body.action === "publish" ? "active" : "draft";
  const payload = formDataToDbPayload(body.data, status);

  const { data, error: dbError } = await supabase
    .from("listings")
    .update(payload)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ listing: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const { id } = await context.params;

  const { data, error: dbError } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
