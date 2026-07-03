/**
 * Best-effort request to refresh the ISR cache for public listing pages.
 * Called from the admin (browser) after a listing mutation. Failures are
 * non-fatal — the pages still revalidate on their normal schedule.
 */
export async function triggerListingRevalidate(slugs?: string | string[]): Promise<void> {
  const slugList = slugs
    ? Array.isArray(slugs)
      ? slugs
      : [slugs]
    : [];

  try {
    await fetch("/api/listings/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: slugList }),
    });
  } catch {
    // Ignore — revalidation is a cache hint, not a critical operation.
  }
}
