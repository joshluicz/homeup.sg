import type { MetadataRoute } from "next";
import { getAllAgentSlugs } from "@/lib/data/agents";
import { getAllListingSlugsServer } from "@/lib/listings/server-queries";
import { SITE_URL } from "@/lib/seo/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const agentPages = getAllAgentSlugs().map((slug) => ({
    url: `${SITE_URL}/agents/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const listingSlugs = await getAllListingSlugsServer();
  const listingPages = listingSlugs.map((slug) => ({
    url: `${SITE_URL}/listings/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
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
    ...listingPages,
    { url: `${SITE_URL}/agents`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    ...agentPages,
    { url: `${SITE_URL}/playbook`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
