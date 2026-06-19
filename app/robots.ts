import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/constants";

/** AI search crawlers we want to allow (see public/llms.txt). */
const AI_SEARCH_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [...AI_SEARCH_BOTS],
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
