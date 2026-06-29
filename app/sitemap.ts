import type { MetadataRoute } from "next";
import { getAllAgentSlugs } from "@/lib/data/agents";
import { getAllListingSlugsServer } from "@/lib/listings/server-queries";
import { getPlaybookArticleSitemapEntries } from "@/lib/playbook/server-queries";
import { SITE_URL } from "@/lib/seo/constants";

/** Refresh listing URLs hourly so new inventory appears without a full redeploy. */
export const revalidate = 3600;

function coreSitemapEntries(now: Date): MetadataRoute.Sitemap {
  const agentPages = getAllAgentSlugs().map((slug) => ({
    url: `${SITE_URL}/agents/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/sell`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/sell-hdb`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/sell-condo`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/sell-landed`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/buy`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/buy-hdb`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/buy-condo-landed`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/buy-new-launch`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/listings`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/agents`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    ...agentPages,
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/playbook`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}

function playbookSitemapEntries(
  articles: { slug: string; updatedAt: string | null }[],
  fallbackDate: Date,
): MetadataRoute.Sitemap {
  return articles.map((article) => ({
    url: `${SITE_URL}/playbook/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : fallbackDate,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const core = coreSitemapEntries(now);
  let listingPages: MetadataRoute.Sitemap = [];
  let playbookPages: MetadataRoute.Sitemap = [];

  try {
    const listingSlugs = (await getAllListingSlugsServer()).filter(Boolean);
    listingPages = listingSlugs.map((slug) => ({
      url: `${SITE_URL}/listings/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));
  } catch (error) {
    console.error("sitemap: listing slug fetch failed, serving core URLs only", error);
  }

  try {
    const playbookArticles = await getPlaybookArticleSitemapEntries();
    playbookPages = playbookSitemapEntries(playbookArticles, now);
  } catch (error) {
    console.error("sitemap: playbook article fetch failed", error);
  }

  return [...core, ...listingPages, ...playbookPages];
}
