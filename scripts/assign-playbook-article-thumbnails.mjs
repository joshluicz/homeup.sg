/**
 * Assign designed article thumbnails + create missing article stubs.
 * Run: node scripts/assign-playbook-article-thumbnails.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const SITE = env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";

function thumbnailPath(filename) {
  return `/images/playbook/articles/${filename}`;
}

const ARTICLES = [
  {
    slug: "how-much-will-you-net-from-selling-your-hdb-2026-calculator-guide",
    title: "How Much Will You Net From Selling Your HDB? 2026 Calculator + Guide",
    description:
      "Work out your HDB sale proceeds after CPF refunds, levies, and fees — with a clear 2026 walkthrough.",
    topic: "upgraders",
    category: "selling",
    thumbnail: thumbnailPath("article-hdb-sales-calculator.png"),
    featured: true,
  },
  {
    slug: "hdb-mop-what-happens-when-your-5-years-are-up",
    title: "HDB MOP: What Happens When Your 5 Years Are Up — And What To Do Next",
    description:
      "Your Minimum Occupation Period is ending. Here are your options — sell, upgrade, or stay — explained plainly.",
    topic: "upgraders",
    category: "selling",
    thumbnail: "/images/playbook/articles/article-hdb-mop.png",
    featured: true,
  },
  {
    slug: "hdb-to-condo-the-exact-step-by-step-upgrade-process-in-singapore-2026",
    title: "HDB to Condo: The Exact Step-by-Step Upgrade Process in Singapore (2026)",
    description:
      "From valuation to keys — the full upgrade timeline, documents, and decisions in order.",
    topic: "upgraders",
    category: "process",
    thumbnail: "/images/playbook/articles/article-hdb-to-condo-2026.png",
    featured: true,
  },
  {
    slug: "upgrade-hdb-to-condo-hybrid-method-no-absd",
    title: "How to Upgrade from HDB to Condo Without ABSD: The Hybrid Method",
    description:
      "Sell first or buy first — both have real costs. Most upgraders don't know there's a third option.",
    topic: "upgraders",
    category: "process",
    thumbnail: "/images/playbook/articles/article-hybrid-no-absd.png",
    featured: true,
  },
  {
    slug: "bridging-loans-in-singapore-when-you-need-one",
    title: "Bridging Loans in Singapore: When You Need One (And When You Don't)",
    description:
      "Bridging loans can unlock an upgrade — or create unnecessary cost. Here's when they make sense.",
    topic: "upgraders",
    category: "tips",
    thumbnail: "/images/playbook/articles/article-bridging-loans.png",
    featured: true,
  },
  {
    slug: "the-importance-of-making-lasting-power-of-attorney",
    title: "The Importance of Making Lasting Power of Attorney",
    description:
      "Why every homeowner should consider an LPA — and how it protects your property decisions if you cannot act for yourself.",
    topic: "upgraders",
    category: "process",
    thumbnail: "/images/playbook/articles/article-lasting-power-of-attorney.png",
    featured: false,
  },
];

const PLACEHOLDER_BODY = `Quick Answer:

This guide is being finalised. Contact HomeUP for a free planning call if you need help now.

Introduction:

We're preparing the full article. Check back soon — or WhatsApp us for personalised advice on your situation.

How HomeUp Approaches This

HomeUP helps Singapore homeowners plan sell-and-buy moves with transparent fees and coordinated timelines. Book a planning call if you'd like guidance before this guide goes live.

Conclusion:

More detail coming soon. In the meantime, browse our other Sell / Upgrade guides on the Playbook.

FAQ:

Q: Is this guide available yet?
A: The full version is coming soon. Our team can answer your questions on a planning call today.
`;

function absoluteThumb(path) {
  // Store relative paths — resolver + Supabase upload script provide live URLs.
  return path.startsWith("/") ? path : `/${path}`;
}

async function main() {
  const { data: existing, error: listError } = await supabase
    .from("playbook_videos")
    .select("id,slug,title,article,thumbnail");

  if (listError) throw listError;

  let updated = 0;
  let created = 0;

  for (const article of ARTICLES) {
    const thumb = absoluteThumb(article.thumbnail);
    const match =
      existing.find((r) => r.slug === article.slug) ||
      existing.find((r) =>
        r.title?.toLowerCase().includes(article.title.slice(0, 24).toLowerCase()),
      );

    if (match) {
      const { error } = await supabase
        .from("playbook_videos")
        .update({
          thumbnail: thumb,
          featured: article.featured,
          topic: article.topic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", match.id);

      if (error) {
        console.error("Update failed:", article.slug, error.message);
      } else {
        console.log("Updated thumbnail:", match.slug);
        updated++;
      }
      continue;
    }

    const { error } = await supabase.from("playbook_videos").insert({
      slug: article.slug,
      title: article.title,
      description: article.description,
      category: article.category,
      topic: article.topic,
      duration: "",
      thumbnail: thumb,
      video_url: "",
      featured: article.featured,
      published_at: new Date().toISOString().slice(0, 10),
      tags: ["HDB", "upgrade"],
      article: PLACEHOLDER_BODY,
      meta_description: article.description,
      faq: [],
    });

    if (error) {
      console.error("Insert failed:", article.slug, error.message);
    } else {
      console.log("Created article:", article.slug);
      created++;
    }
  }

  console.log(`\nDone. Updated: ${updated} | Created: ${created}`);
}

main();
