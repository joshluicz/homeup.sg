import { NextResponse } from "next/server";

/** Hosting/registrar reachability probe used by some .sg hosts. */
export async function GET() {
  return new NextResponse("ok", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
