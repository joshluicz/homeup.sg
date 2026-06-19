import { NextResponse } from "next/server";
import {
  buildOpenIdConfigurationMetadata,
  OAUTH_DISCOVERY_CACHE_CONTROL,
} from "@/lib/agent-discovery/oauth-discovery";

export async function GET() {
  const metadata = buildOpenIdConfigurationMetadata();
  if (!metadata) {
    return NextResponse.json(
      { error: "OAuth discovery is not configured (missing NEXT_PUBLIC_SUPABASE_URL)." },
      { status: 503 },
    );
  }

  return NextResponse.json(metadata, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": OAUTH_DISCOVERY_CACHE_CONTROL,
    },
  });
}

export async function HEAD() {
  const metadata = buildOpenIdConfigurationMetadata();
  return new NextResponse(null, { status: metadata ? 200 : 503 });
}
