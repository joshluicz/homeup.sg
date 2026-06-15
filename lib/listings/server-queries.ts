import { createClient } from "@supabase/supabase-js";

/** Server/build-time Supabase queries (no cookies). Used by sitemap and generateStaticParams. */
export async function getAllListingSlugsServer(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("listings")
    .select("slug")
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    console.warn("getAllListingSlugsServer:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.slug as string);
}

export async function getListingBySlugServer(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return {
    ...data,
    price: Number(data.price),
    area_sqft: Number(data.area_sqft),
    image_urls: (data.image_urls as string[]) ?? [],
  };
}
