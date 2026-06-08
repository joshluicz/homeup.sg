import { createClient } from "@/lib/supabase/server";
import { computeAreaSqm, computePricePsf } from "@/lib/listings/utils";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listedAs = searchParams.get("listed_as");
  const flatType = searchParams.get("flat_type");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const isFeatured = searchParams.get("is_featured");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (listedAs) query = query.eq("listed_as", listedAs);
  if (flatType) query = query.eq("flat_type", flatType);
  if (minPrice) query = query.gte("price", parseFloat(minPrice));
  if (maxPrice) query = query.lte("price", parseFloat(maxPrice));
  if (isFeatured === "true") query = query.eq("is_featured", true);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings = (data ?? []).map((listing) => ({
    ...listing,
    price_psf: computePricePsf(Number(listing.price), Number(listing.area_sqft)),
    area_sqm: computeAreaSqm(Number(listing.area_sqft)),
  }));

  return NextResponse.json({
    listings,
    pagination: {
      page,
      page_size: PAGE_SIZE,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    },
  });
}
