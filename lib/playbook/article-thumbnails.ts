import thumbnailUrls from "@/lib/data/playbook-article-thumbnail-urls.json";
import { resolveThumbnail } from "@/lib/playbook/embed";

/** Local public paths (localhost / after static deploy). */
const LOCAL_THUMBNAIL_BY_SLUG: Record<string, string> = {
  "how-much-will-you-net-from-selling-your-hdb-2026-calculator-guide":
    "/images/playbook/articles/article-hdb-sales-calculator.png",
  "hdb-mop-what-happens-when-your-5-years-are-up":
    "/images/playbook/articles/article-hdb-mop.png",
  "hdb-to-condo-the-exact-step-by-step-upgrade-process-in-singapore-2026":
    "/images/playbook/articles/article-hdb-to-condo-2026.png",
  "upgrade-hdb-to-condo-hybrid-method-no-absd":
    "/images/playbook/articles/article-hybrid-no-absd.png",
  "bridging-loans-in-singapore-when-you-need-one":
    "/images/playbook/articles/article-bridging-loans.png",
  "the-importance-of-making-lasting-power-of-attorney":
    "/images/playbook/articles/article-lasting-power-of-attorney.png",
  "private-condo-vs-hdb-first-home-singapore":
    "/images/playbook/articles/article-hdb-or-condo-first-home.png",
  "buying-tenanted-property-singapore-checks":
    "/images/playbook/articles/article-buying-tenanted-property.png",
  "income-requirements-loans-first-condo-singapore":
    "/images/playbook/articles/article-3-loan-rules-condo.png",
  "overlooked-factors-buying-condo-singapore":
    "/images/playbook/articles/article-5-downpayment-easy-part.png",
  "private-condo-vs-ec-when-to-choose-condo":
    "/images/playbook/articles/article-ec-or-condo-2026.png",
  "agent-commission-fixed-fee-vs-2-percent-singapore":
    "/images/playbook/articles/article-agent-commission-fixed-fee-vs-2.png",
  "absd-2026-5-legal-ways-to-reduce-or-avoid-it":
    "/images/playbook/articles/article-absd-2026-5-legal-ways.png",
  "buy-condo-with-cpf-rules-limits-mistakes-singapore":
    "/images/playbook/articles/article-buy-condo-with-cpf.png",
  "hdb-owners-should-you-upgrade-in-2026-singapore":
    "/images/playbook/articles/article-hdb-owners-upgrade-2026.png",
  "upgrade-guide-hdb-vs-condo-which-is-better-for-you":
    "/images/playbook/articles/article-upgrade-guide-hdb-vs-condo.png",
  "decoupling-property-singapore-does-it-make-sense":
    "/images/playbook/articles/article-decoupling-does-it-make-sense.png",
};

const SUPABASE_THUMBNAIL_BY_SLUG = thumbnailUrls as Record<string, string>;

const ARTICLE_THUMBNAIL_RULES: Array<{ match: RegExp; slug: string }> = [
  { match: /net.*sell|sales proceed|calculator|how much will you net/i, slug: "how-much-will-you-net-from-selling-your-hdb-2026-calculator-guide" },
  { match: /hdb mop|5 years are up|minimum occupation period/i, slug: "hdb-mop-what-happens-when-your-5-years-are-up" },
  { match: /step-by-step upgrade|exact step.*upgrade|upgrade process.*2026|hdb to condo.*2026/i, slug: "hdb-to-condo-the-exact-step-by-step-upgrade-process-in-singapore-2026" },
  { match: /hybrid method|without absd|upgrade.*hdb.*condo.*no absd/i, slug: "upgrade-hdb-to-condo-hybrid-method-no-absd" },
  { match: /bridging loan/i, slug: "bridging-loans-in-singapore-when-you-need-one" },
  { match: /lasting power of attorney|\blpa\b/i, slug: "the-importance-of-making-lasting-power-of-attorney" },
  { match: /hdb or condo.*first home|private condo.*first home|how to actually decide/i, slug: "private-condo-vs-hdb-first-home-singapore" },
  { match: /tenanted property|before you sign the otp/i, slug: "buying-tenanted-property-singapore-checks" },
  { match: /3 borrowing rules|loan rules|income requirements.*first condo|before you start viewing condo/i, slug: "income-requirements-loans-first-condo-singapore" },
  { match: /5% down payment|downpayment is the easy part|overlooked factors.*buying a condo/i, slug: "overlooked-factors-buying-condo-singapore" },
  { match: /ec or condo|executive condo.*first home|may 2026 rule/i, slug: "private-condo-vs-ec-when-to-choose-condo" },
  { match: /fixed fee vs 2%|agent commission.*fixed fee|fixed fee.*commission/i, slug: "agent-commission-fixed-fee-vs-2-percent-singapore" },
  { match: /absd 2026|5 legal ways.*absd|reduce or avoid.*absd/i, slug: "absd-2026-5-legal-ways-to-reduce-or-avoid-it" },
  { match: /buy condo with cpf|cpf.*buy.*condo|cpf rules.*limits/i, slug: "buy-condo-with-cpf-rules-limits-mistakes-singapore" },
  { match: /hdb owners.*upgrade in 2026|should you upgrade in 2026/i, slug: "hdb-owners-should-you-upgrade-in-2026-singapore" },
  { match: /upgrade guide.*hdb vs condo|hdb vs condo.*which is better for you/i, slug: "upgrade-guide-hdb-vs-condo-which-is-better-for-you" },
  { match: /decoupling.*make sense|property decoupling|practical guide.*decoupling/i, slug: "decoupling-property-singapore-does-it-make-sense" },
];

function isBrokenSiteThumbnail(thumbnail?: string): boolean {
  const t = (thumbnail || "").trim();
  if (!t) return false;
  return /homeup\.sg\/images\/playbook\/articles\//i.test(t);
}

function isUsableDbThumbnail(thumbnail?: string): boolean {
  const t = (thumbnail || "").trim();
  if (!t) return false;
  if (t.includes("unsplash.com")) return false;
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(t)) return false;
  if (isBrokenSiteThumbnail(t)) return false;
  return true;
}

function thumbnailForSlug(slug: string): string {
  return SUPABASE_THUMBNAIL_BY_SLUG[slug] || LOCAL_THUMBNAIL_BY_SLUG[slug] || "";
}

/** Designed blog thumbnails — Supabase CDN URLs (works on localhost and production). */
export function resolveArticleThumbnail(article: {
  slug: string;
  title: string;
  thumbnail?: string;
}): string {
  const fromDb = resolveThumbnail(article.thumbnail, "");
  if (isUsableDbThumbnail(fromDb)) return fromDb;

  const bySlug = thumbnailForSlug(article.slug);
  if (bySlug) return bySlug;

  const haystack = `${article.slug} ${article.title}`;
  for (const rule of ARTICLE_THUMBNAIL_RULES) {
    if (rule.match.test(haystack)) return thumbnailForSlug(rule.slug);
  }

  return "";
}

export function articleHasDesignedThumbnail(article: { slug: string; title: string; thumbnail?: string }): boolean {
  return Boolean(resolveArticleThumbnail(article));
}
