const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://homeup.sg").replace(/\/$/, "");
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/** Warm playbook URLs so Googlebot's next crawl hits a hot cache, not a cold serverless render. */
export async function warmPlaybookUrls(slugs: string[] = []): Promise<{ warmed: number; failed: number }> {
  const urls = [
    `${SITE_URL}/playbook`,
    ...slugs.map((slug) => `${SITE_URL}/playbook/${slug}`),
  ];

  let failed = 0;
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": GOOGLEBOT_UA, Accept: "text/html" },
          redirect: "follow",
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
    }),
  );

  return { warmed: urls.length, failed };
}

/** Fire-and-forget warmup — used after on-demand revalidation. */
export function warmPlaybookUrlsInBackground(slugs: string[] = []): void {
  void warmPlaybookUrls(slugs).catch((error) => {
    console.warn("warmPlaybookUrlsInBackground:", error);
  });
}
