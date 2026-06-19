import { type NextRequest, NextResponse } from "next/server";
import { HOMEPAGE_LINK_HEADER } from "@/lib/agent-discovery/constants";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const response = NextResponse.next();
    response.headers.set("Link", HOMEPAGE_LINK_HEADER);
    return response;
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (pathname.startsWith("/admin/login")) {
    if (user) {
      return NextResponse.redirect(new URL("/admin/listings", request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
