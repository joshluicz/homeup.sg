import { getAllAgentSlugs } from "@/lib/data/agents";
import { PLAYBOOK_TOPICS } from "@/lib/data/playbook";
import { getAllListingSlugsServer } from "@/lib/listings/server-queries";
import { getPlaybookArticleSitemapEntries } from "@/lib/playbook/sitemap-entries";
import { SITE_URL } from "@/lib/seo/constants";

export type SitemapUrlKind = "core" | "listing" | "playbook";

export interface SitemapUrlEntry {
  url: string;
  slug: string;
  kind: SitemapUrlKind;
  label: string;
  updatedAt: string | null;
}

/** Mirrors app/sitemap.ts — single source for “pages we expect Google to know about”. */
export async function collectSitemapUrls(): Promise<SitemapUrlEntry[]> {
  const now = new Date().toISOString();
  const entries: SitemapUrlEntry[] = [];

  const corePaths: { path: string; label: string }[] = [
    { path: "/", label: "Home" },
    { path: "/sell", label: "Sell" },
    { path: "/sell-hdb", label: "Sell HDB" },
    { path: "/sell-condo", label: "Sell condo" },
    { path: "/sell-landed", label: "Sell landed" },
    { path: "/buy", label: "Buy" },
    { path: "/buy-hdb", label: "Buy HDB" },
    { path: "/buy-condo-landed", label: "Buy condo/landed" },
    { path: "/buy-new-launch", label: "Buy new launch" },
    { path: "/listings", label: "Listings index" },
    { path: "/agents", label: "Agents index" },
    { path: "/about", label: "About" },
    { path: "/playbook", label: "Playbook index" },
    { path: "/privacy-policy", label: "Privacy policy" },
    ...getAllAgentSlugs().map((slug) => ({ path: `/agents/${slug}`, label: `Agent: ${slug}` })),
    ...PLAYBOOK_TOPICS.map((topic) => ({ path: `/playbook/topic/${topic}`, label: `Topic: ${topic}` })),
  ];

  for (const { path, label } of corePaths) {
    entries.push({
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      slug: path,
      kind: "core",
      label,
      updatedAt: now,
    });
  }

  try {
    const listingSlugs = (await getAllListingSlugsServer()).filter(Boolean);
    for (const slug of listingSlugs) {
      entries.push({
        url: `${SITE_URL}/listings/${slug}`,
        slug,
        kind: "listing",
        label: slug,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error("collectSitemapUrls: listings failed", error);
  }

  try {
    const articles = await getPlaybookArticleSitemapEntries();
    for (const article of articles) {
      entries.push({
        url: `${SITE_URL}/playbook/${article.slug}`,
        slug: article.slug,
        kind: "playbook",
        label: article.slug,
        updatedAt: article.updatedAt,
      });
    }
  } catch (error) {
    console.error("collectSitemapUrls: playbook failed", error);
  }

  return entries;
}
