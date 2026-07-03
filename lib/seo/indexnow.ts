import { SITE_URL } from "@/lib/seo/constants";

/** Must match `public/<key>.txt` and the IndexNow key registered with Bing/Yandex. */
export const INDEXNOW_KEY = "homeupsg2026indexnowbingyandex01";
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_HOST = new URL(SITE_URL).host;

export type IndexNowScope = "listings" | "playbook" | "all";

export type IndexNowResult = {
  ok: boolean;
  status: number;
  submitted: number;
  message?: string;
};

export function listingUrl(slug: string): string {
  return `${SITE_URL}/listings/${slug}`;
}

export function playbookArticleUrl(slug: string): string {
  return `${SITE_URL}/playbook/${slug}`;
}

export function listingsIndexUrl(): string {
  return `${SITE_URL}/listings`;
}

export function playbookIndexUrl(): string {
  return `${SITE_URL}/playbook`;
}

export async function submitIndexNow(urls: string[]): Promise<IndexNowResult> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) {
    return { ok: true, status: 200, submitted: 0 };
  }

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: unique,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("IndexNow submission failed:", res.status, text || res.statusText);
    return {
      ok: false,
      status: res.status,
      submitted: unique.length,
      message: text || res.statusText,
    };
  }

  console.log(`IndexNow OK (${res.status}): submitted ${unique.length} URL(s)`);
  return { ok: true, status: res.status, submitted: unique.length };
}

export async function collectIndexNowUrls(
  scope: IndexNowScope,
): Promise<string[]> {
  const { getAllListingSlugsServer } = await import("@/lib/listings/server-queries");
  const { getPlaybookArticleSitemapEntries } = await import("@/lib/playbook/server-queries");

  const urls: string[] = [];

  if (scope === "listings" || scope === "all") {
    const listingSlugs = await getAllListingSlugsServer();
    urls.push(listingsIndexUrl(), ...listingSlugs.map(listingUrl));
  }

  if (scope === "playbook" || scope === "all") {
    const articles = await getPlaybookArticleSitemapEntries();
    urls.push(playbookIndexUrl(), ...articles.map((article) => playbookArticleUrl(article.slug)));
  }

  return [...new Set(urls)];
}

/** Notify Bing/Yandex when listing pages change. Best-effort; never throws. */
export async function notifyListingsChanged(slugs: string[] = []): Promise<IndexNowResult | null> {
  try {
    const urls = [listingsIndexUrl(), ...slugs.map(listingUrl)];
    return await submitIndexNow(urls);
  } catch (error) {
    console.error("IndexNow listings notification failed:", error);
    return null;
  }
}

/** Notify Bing/Yandex when playbook article pages change. Best-effort; never throws. */
export async function notifyPlaybookArticlesChanged(
  slugs: string[] = [],
): Promise<IndexNowResult | null> {
  try {
    const urls = [playbookIndexUrl(), ...slugs.map(playbookArticleUrl)];
    return await submitIndexNow(urls);
  } catch (error) {
    console.error("IndexNow playbook notification failed:", error);
    return null;
  }
}
