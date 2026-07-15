import { revalidatePath, revalidateTag } from "next/cache";
import { LISTINGS_CACHE_TAG } from "@/lib/listings/server-queries";
import { SITE_URL } from "@/lib/seo/constants";
import { notifyListingsChanged } from "@/lib/seo/indexnow";

const PUBLIC_LISTING_PATHS = ["/", "/listings", "/sell", "/about", "/sitemap.xml"] as const;

/**
 * Public routes whose rendered content depends on the `listings` table.
 * Call after any mutation that changes which listings are live (publish,
 * archive, edit, delete, create) so the ISR cache doesn't serve stale data.
 *
 * `revalidateTag` clears the unstable_cache entries used by server-queries.
 * `revalidatePath` clears the Full Route Cache HTML.
 * Optional warming forces regeneration so the next visitor isn't first to pay.
 */
export function revalidateListingPaths(
  slugs: string[] = [],
  options: { warm?: boolean } = {},
): void {
  revalidateTag(LISTINGS_CACHE_TAG);

  for (const path of PUBLIC_LISTING_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/listings/[slug]", "page");

  for (const slug of slugs) {
    if (slug) revalidatePath(`/listings/${slug}`);
  }

  void notifyListingsChanged(slugs);

  if (options.warm !== false) {
    void warmPublicListingPages(slugs);
  }
}

/** Hit public pages so Vercel regenerates them immediately after invalidation. */
export async function warmPublicListingPaths(slugs: string[] = []): Promise<void> {
  const paths = [
    ...PUBLIC_LISTING_PATHS.filter((path) => path !== "/sitemap.xml"),
    ...slugs.slice(0, 20).map((slug) => `/listings/${slug}`),
  ];

  await Promise.allSettled(
    paths.map((path) =>
      fetch(`${SITE_URL}${path}`, {
        method: "GET",
        cache: "no-store",
        headers: { "x-homeup-cache-warm": "1" },
      }).catch(() => null),
    ),
  );
}

async function warmPublicListingPages(slugs: string[]): Promise<void> {
  try {
    await warmPublicListingPaths(slugs);
  } catch (error) {
    console.error("[listings] failed to warm public pages:", error);
  }
}
