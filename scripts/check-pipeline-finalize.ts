/**
 * Smoke test: finalizePipelineDraft fills missing sections + FAQ field.
 */
import { validateArticleSections } from "@/lib/playbook/article-sections";
import { finalizePipelineDraft } from "@/lib/pipeline/finalize-draft";
import type { Brief } from "@/lib/pipeline/types";

const brief: Brief = {
  topic: {
    id: "test",
    title: "Can I Buy a Condo While Still Owning My HDB?",
    searchIntent: "upgrade",
    category: "hdb_upgrade",
    demand: "high",
    evergreen: true,
    tags: ["HDB", "condo"],
    source: "custom",
  },
  seoTitle: "Can I Buy a Condo While Still Owning My HDB?",
  h2Questions: [
    "Can I buy a private condo before selling my HDB flat?",
    "Do I need to meet the MOP before buying a condo?",
    "Can I rent out my HDB flat if I buy a condo?",
  ],
  primaryKeywords: ["HDB", "condo", "ABSD"],
  secondaryKeywords: ["upgrade"],
  authorSlug: "dennis-lim",
  authorName: "Dennis Lim",
  authorCea: "R055990G",
  targetWordCount: 550,
};

const article = `Quick Answer:

Yes — with ABSD and financing rules.

Introduction:

This guide is for HDB owners. I'm Dennis Lim from HomeUp, a fixed-fee property agent helping Singapore homeowners.

Can I buy a private condo before selling my HDB flat?

You generally can, subject to ABSD and loan rules.

Do I need to meet the MOP before buying a condo?

Yes, MOP applies before an HDB upgrade sale.`;

const faq = [
  { q: "Can PRs buy resale condos?", a: "Yes, with ABSD." },
  { q: "What is ABSD?", a: "Additional Buyer's Stamp Duty." },
  { q: "Can I use CPF?", a: "Yes, within limits." },
  { q: "Can I use HDB loan?", a: "No for private property." },
  { q: "What is an EC?", a: "Executive Condominium." },
];

const { draft, articleSections, autoFixes } = finalizePipelineDraft(
  {
    brief,
    title: brief.seoTitle,
    description: "x".repeat(200),
    metaDescription: "",
    article,
    faq,
  },
  "can-i-buy-condo-while-owning-hdb",
);

const validation = validateArticleSections(articleSections, draft.faq);

if (!validation.ok) {
  console.error("FAIL: validation after finalize:", validation.errors);
  process.exit(1);
}

if (draft.article.includes("FAQ:")) {
  console.error("FAIL: serialized article should not contain inline FAQ block");
  process.exit(1);
}

if (draft.faq.length < 3) {
  console.error("FAIL: FAQ array too short");
  process.exit(1);
}

if (draft.description.split(/\s+/).length > 35) {
  console.error("FAIL: description not trimmed to 35 words");
  process.exit(1);
}

if (!draft.articleSections?.homeup || !draft.articleSections?.conclusion) {
  console.error("FAIL: missing HomeUp or Conclusion structured sections");
  process.exit(1);
}

console.log("Pipeline finalize smoke test passed.", autoFixes.length, "auto-fixes");
