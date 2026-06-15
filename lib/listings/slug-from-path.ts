/** Static-export shell route — see public/.htaccess listing rewrite rules. */
export const LISTING_DETAIL_FALLBACK_SLUG = "_";

const LISTING_PATH_RE = /\/listings\/([^/]+)\/?$/;

export function getListingSlugFromPathname(pathname: string): string | null {
  const match = pathname.match(LISTING_PATH_RE);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  if (!slug || slug === LISTING_DETAIL_FALLBACK_SLUG) return null;
  return slug;
}

/** Prefer the URL path so htaccess fallback shells still load the right listing. */
export function resolveListingSlug(routeSlug: string, pathname?: string): string {
  if (pathname) {
    const fromPath = getListingSlugFromPathname(pathname);
    if (fromPath) return fromPath;
  }

  if (typeof window !== "undefined") {
    const fromPath = getListingSlugFromPathname(window.location.pathname);
    if (fromPath) return fromPath;
  }

  return routeSlug === LISTING_DETAIL_FALLBACK_SLUG ? "" : routeSlug;
}
