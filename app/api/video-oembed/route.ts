import { fetchOEmbedThumbnail } from "@/lib/playbook/oembed";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const thumbnail_url = await fetchOEmbedThumbnail(url);
  return NextResponse.json(
    { thumbnail_url },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
