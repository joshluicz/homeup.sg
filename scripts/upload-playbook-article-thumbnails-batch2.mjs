/**
 * Create 6 new playbook articles (if missing) and upload their designed thumbnails.
 * Run: node scripts/upload-playbook-article-thumbnails-batch2.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const BUCKET = "listing-images";
const JSON_PATH = resolve(ROOT, "lib/data/playbook-article-thumbnail-urls.json");

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

const PLACEHOLDER_BODY = `Quick Answer:

This guide is being finalised. Contact HomeUP for a free planning call if you need help now.

Introduction:

We're preparing the full article. Check back soon — or WhatsApp us for personalised advice on your situation.

How HomeUp Approaches This

HomeUP helps Singapore homeowners plan sell-and-buy moves with transparent fees and coordinated timelines. Book a planning call if you'd like guidance before this guide goes live.

Conclusion:

More detail coming soon. In the meantime, browse our other Playbook guides.

FAQ:

Q: Is this guide available yet?
A: The full version is coming soon. Our team can answer your questions on a planning call today.
`;

/** Thumbnail image → dedicated article (one-to-one, verified against playbook topics). */
const ARTICLES = [
  {
    slug: "agent-commission-fixed-fee-vs-2-percent-singapore",
    title: "Agent Commission: Fixed Fee vs 2%",
    description:
      "Compare HomeUP's transparent flat fee with a typical 2% agent commission on a Singapore property sale.",
    topic: "condo_tips",
    category: "selling",
    file: "article-agent-commission-fixed-fee-vs-2.png",
    featured: false,
  },
  {
    slug: "absd-2026-5-legal-ways-to-reduce-or-avoid-it",
    title: "ABSD 2026: 5 Legal Ways to Reduce or Avoid It",
    description:
      "Five legitimate strategies Singapore property buyers use to reduce or avoid Additional Buyer's Stamp Duty in 2026.",
    topic: "upgraders",
    category: "tips",
    file: "article-absd-2026-5-legal-ways.png",
    featured: true,
  },
  {
    slug: "buy-condo-with-cpf-rules-limits-mistakes-singapore",
    title: "Buy Condo with CPF: Rules, Limits & Mistakes",
    description:
      "How CPF works when buying a private condo in Singapore — limits, refund rules, and the mistakes buyers regret.",
    topic: "buying_first",
    category: "buying",
    file: "article-buy-condo-with-cpf.png",
    featured: true,
  },
  {
    slug: "hdb-owners-should-you-upgrade-in-2026-singapore",
    title: "HDB Owners: Should You Upgrade in 2026?",
    description:
      "Whether 2026 is the right year for HDB owners to sell and upgrade — timing, costs, and what to decide first.",
    topic: "upgraders",
    category: "process",
    file: "article-hdb-owners-upgrade-2026.png",
    featured: true,
  },
  {
    slug: "upgrade-guide-hdb-vs-condo-which-is-better-for-you",
    title: "Upgrade Guide: HDB vs Condo — Which Is Better for You?",
    description:
      "Already own an HDB? Here's how to weigh staying, upgrading within HDB, or moving to private condo.",
    topic: "upgraders",
    category: "tips",
    file: "article-upgrade-guide-hdb-vs-condo.png",
    featured: true,
  },
  {
    slug: "decoupling-property-singapore-does-it-make-sense",
    title: "Decoupling in Singapore: Does It Make Sense?",
    description:
      "A practical guide to property decoupling — when it helps, what it costs, and when you're better off skipping it.",
    topic: "upgraders",
    category: "process",
    file: "article-decoupling-does-it-make-sense.png",
    featured: false,
  },
];

async function ensureArticle(article) {
  const { data: existing, error: findError } = await supabase
    .from("playbook_videos")
    .select("id, slug, title")
    .eq("slug", article.slug)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) {
    console.log(`• Article exists: ${existing.slug}`);
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("playbook_videos")
    .insert({
      slug: article.slug,
      title: article.title,
      description: article.description,
      category: article.category,
      topic: article.topic,
      duration: "",
      thumbnail: `/images/playbook/articles/${article.file}`,
      video_url: "",
      featured: article.featured,
      published_at: new Date().toISOString().slice(0, 10),
      tags: [],
      article: PLACEHOLDER_BODY,
      meta_description: article.description,
      faq: [],
    })
    .select("id, slug")
    .single();

  if (insertError) throw insertError;
  console.log(`• Created article: ${created.slug}`);
  return created;
}

async function uploadThumbnail(article) {
  const localPath = resolve(ROOT, "public/images/playbook/articles", article.file);
  const storagePath = `playbook/thumbnails/${article.file}`;
  const body = readFileSync(localPath);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, body, {
    upsert: true,
    contentType: "image/png",
    cacheControl: "31536000",
  });

  if (uploadError) throw new Error(`${article.file}: ${uploadError.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("playbook_videos")
    .update({ thumbnail: publicUrl, updated_at: new Date().toISOString() })
    .eq("slug", article.slug);

  if (updateError) throw new Error(`${article.slug}: ${updateError.message}`);

  console.log(`✅ ${article.slug}\n   ${publicUrl}`);
  return { slug: article.slug, publicUrl };
}

async function main() {
  const uploaded = [];
  for (const article of ARTICLES) {
    await ensureArticle(article);
    uploaded.push(await uploadThumbnail(article));
  }

  const existing = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  const merged = { ...existing, ...Object.fromEntries(uploaded.map((r) => [r.slug, r.publicUrl])) };
  writeFileSync(JSON_PATH, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`\nUpdated ${JSON_PATH} (${uploaded.length} new thumbnails)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
