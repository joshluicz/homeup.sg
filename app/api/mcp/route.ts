import { NextResponse } from "next/server";
import { getListingBySlugServer, getActiveListingsServer } from "@/lib/listings/server-queries";

/** Minimal MCP-style tool dispatcher for the public listings API. */
export async function POST(request: Request) {
  let body: {
    method?: string;
    params?: { name?: string; arguments?: Record<string, unknown> };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.method !== "tools/call" || !body.params?.name) {
    return NextResponse.json({
      tools: [
        { name: "search_listings", description: "Search active listings" },
        { name: "get_listing", description: "Get listing by slug" },
      ],
    });
  }

  const { name, arguments: args = {} } = body.params;

  if (name === "search_listings") {
    const listings = await getActiveListingsServer(20);
    let filtered = listings;
    const flatType = args.flat_type as string | undefined;
    const listedAs = args.listed_as as string | undefined;
    if (flatType) filtered = filtered.filter((l) => l.flat_type === flatType);
    if (listedAs) filtered = filtered.filter((l) => l.listed_as === listedAs);

    return NextResponse.json({
      content: [{ type: "text", text: JSON.stringify({ listings: filtered }, null, 2) }],
    });
  }

  if (name === "get_listing") {
    const slug = args.slug as string | undefined;
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }
    const listing = await getListingBySlugServer(slug);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json({
      content: [{ type: "text", text: JSON.stringify({ listing }, null, 2) }],
    });
  }

  return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
}

export async function GET() {
  return NextResponse.json({
    name: "HomeUP Listings MCP",
    version: "1.0.0",
    server_card: "https://homeup.sg/.well-known/mcp/server-card.json",
  });
}
