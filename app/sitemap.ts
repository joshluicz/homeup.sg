import type { MetadataRoute } from "next";
import { getAllAgentSlugs } from "@/lib/data/agents";

const BASE = "https://lp.homeup.sg";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const agentPages = getAllAgentSlugs().map((slug) => ({
    url: `${BASE}/agents/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/sell`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/sell-hdb`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/sell-condo`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/sell-landed`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/buy`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/buy-hdb`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/buy-condo-landed`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/buy-new-launch`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/listings`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/agents`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    ...agentPages,
    { url: `${BASE}/playbook`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
