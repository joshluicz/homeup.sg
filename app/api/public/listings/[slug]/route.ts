import { createClient } from "@/lib/supabase/server";
import { computeAreaSqm, computePricePsf } from "@/lib/listings/utils";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({
    listing: {
      ...data,
      price_psf: computePricePsf(Number(data.price), Number(data.area_sqft)),
      area_sqm: computeAreaSqm(Number(data.area_sqft)),
    },
  });
}
