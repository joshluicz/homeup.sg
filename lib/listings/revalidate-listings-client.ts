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
    const res = await fetch("/api/listings/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: slugList, warm: true }),
    });
    if (!res.ok) {
      console.warn("[listings] revalidate request failed:", res.status, await res.text());
    }
  } catch (error) {
    console.warn("[listings] revalidate request error:", error);
  }
}
