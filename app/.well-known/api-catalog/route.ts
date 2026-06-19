import { NextResponse } from "next/server";
import {
  API_CATALOG_CONTENT_TYPE,
  API_CATALOG_LINKSET,
  API_CATALOG_PATH,
} from "@/lib/agent-discovery/constants";

export async function GET() {
  return NextResponse.json(API_CATALOG_LINKSET, {
    headers: {
      "Content-Type": API_CATALOG_CONTENT_TYPE,
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Link: `<${API_CATALOG_PATH}>; rel="api-catalog"`,
    },
  });
}
