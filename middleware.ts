import { type NextRequest, NextResponse } from "next/server";
import { HOMEPAGE_LINK_HEADER } from "@/lib/agent-discovery/constants";
import {
  getMarkdownForPath,
  markdownResponse,
  wantsMarkdown,
} from "@/lib/agent-discovery/markdown-negotiation";
import { updateSession } from "@/lib/supabase/middleware";

function shouldSkipMarkdown(pathname: string): boolean {
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/.well-known")) return true;
  if (pathname.startsWith("/images/")) return true;
  if (pathname === "/auth.md") return true;
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|woff2|txt|json|xml)$/i.test(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!shouldSkipMarkdown(pathname) && wantsMarkdown(request)) {
    const markdown = await getMarkdownForPath(pathname);
    if (markdown) return markdownResponse(markdown);
  }

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

  if (pathname === "/admin/listings" && request.nextUrl.searchParams.get("tab") === "agent-videos") {
    return NextResponse.redirect(new URL("/admin/agent-profiles", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
