/**
 * Full SEO/GEO/AEO audit report — lp.homeup.sg — 14 June 2026
 * Run: node scripts/generate-seo-audit-report-2026-06-14.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageNumber,
  PageBreak,
} = require("docx");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DOMAIN = "lp.homeup.sg";
const AUDIT_DATE = "14 June 2026";
const AUDIT_TYPE = "FULL AUDIT";
const SCORES = { seo: 7, geo: 8, aeo: 8 };
const COMBINED = SCORES.seo + SCORES.geo + SCORES.aeo;
const BASELINE = { seo: 4, geo: 5, aeo: 3, combined: 12 };

const C = {
  navy: "1B2A4A",
  blue: "2563EB",
  green: "16A34A",
  amber: "D97706",
  red: "DC2626",
  orange: "EA580C",
  lgray: "F8F9FA",
  mgray: "E2E8F0",
  dark: "1E293B",
  lblue: "EFF6FF",
  lgreen: "F0FDF4",
  ltblue: "93C5FD",
  attrib: "94A3B8",
  white: "FFFFFF",
};

function scoreColor(s) {
  return s >= 8 ? C.green : s >= 5 ? C.amber : C.red;
}
function scoreStatus(s) {
  return s >= 8 ? "Strong" : s >= 5 ? "On Track" : "Needs Work";
}
function shade(fill) {
  return { type: ShadingType.SOLID, fill, color: fill };
}

const BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: C.mgray },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: C.mgray },
  left: { style: BorderStyle.SINGLE, size: 4, color: C.mgray },
  right: { style: BorderStyle.SINGLE, size: 4, color: C.mgray },
  insideH: { style: BorderStyle.SINGLE, size: 2, color: C.mgray },
  insideV: { style: BorderStyle.SINGLE, size: 2, color: C.mgray },
};
const NO_BORDERS = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
  insideH: { style: BorderStyle.NONE },
  insideV: { style: BorderStyle.NONE },
};

function run(text, opts = {}) {
  return new TextRun({
    text,
    font: "Arial",
    size: (opts.size || 11) * 2,
    bold: opts.bold || false,
    italics: opts.italic || false,
    color: opts.color || C.dark,
  });
}

function para(runs, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before || 0, after: opts.after || 100 },
    children: Array.isArray(runs) ? runs : [runs],
  });
}

function hCell(text, bg = C.navy) {
  return new TableCell({
    shading: shade(bg),
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      para(run(text, { bold: true, color: C.white, size: 10 }), {
        align: AlignmentType.CENTER,
      }),
    ],
  });
}

function dCell(text, bg, opts = {}) {
  return new TableCell({
    shading: shade(bg),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      para(run(text, opts), {
        align: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      }),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 36, bold: true, color: C.navy })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: C.dark })],
  });
}

function findingTable(rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [hCell("Signal"), hCell("Finding"), hCell("Status")],
  });

  const dataRows = rows.map(([signal, finding, status], i) => {
    const bg = i % 2 === 0 ? C.white : C.lgray;
    const statusBg =
      status === "Good" ? C.green : status === "Needs Attention" ? C.amber : C.red;
    return new TableRow({
      children: [
        new TableCell({
          shading: shade(bg),
          width: { size: 25, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [para(run(signal, { bold: true }))],
        }),
        new TableCell({
          shading: shade(bg),
          width: { size: 55, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [para(run(finding))],
        }),
        new TableCell({
          shading: shade(statusBg),
          width: { size: 20, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [
            para(run(status, { bold: true, color: C.white }), {
              align: AlignmentType.CENTER,
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows: [headerRow, ...dataRows],
  });
}

function makeCoverSection() {
  const scoreCells = ["SEO", "GEO", "AEO"].map((label, i) => {
    const s = [SCORES.seo, SCORES.geo, SCORES.aeo][i];
    return new TableCell({
      shading: shade(scoreColor(s)),
      margins: { top: 200, bottom: 120, left: 120, right: 120 },
      children: [
        para(run(label, { bold: true, color: C.white, size: 10 }), {
          align: AlignmentType.CENTER,
          after: 40,
        }),
        para(run(String(s), { bold: true, color: C.white, size: 36 }), {
          align: AlignmentType.CENTER,
          after: 40,
        }),
        para(run(scoreStatus(s), { italic: true, color: C.white, size: 9 }), {
          align: AlignmentType.CENTER,
          after: 80,
        }),
      ],
    });
  });

  const navyPara = () =>
    new Paragraph({ shading: shade(C.navy), spacing: { after: 0 }, children: [run(" ")] });

  return {
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [
      ...Array(9).fill(null).map(() => navyPara()),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({ text: DOMAIN, font: "Arial", size: 72, bold: true, color: C.white }),
        ],
      }),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: "SEO / GEO / AEO Audit Report",
            font: "Arial",
            size: 36,
            color: C.ltblue,
          }),
        ],
      }),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: AUDIT_TYPE, font: "Arial", size: 22, color: C.white })],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [new TableRow({ children: scoreCells })],
      }),
      ...Array(9).fill(null).map(() => navyPara()),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({ text: AUDIT_DATE, font: "Arial", size: 18, color: C.attrib }),
        ],
      }),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "Claude Skill and Plugin by Alex Labat",
            font: "Arial",
            size: 18,
            color: C.attrib,
          }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] }),
    ],
  };
}

function makeMainSection() {
  const children = [];

  children.push(heading1("Executive Summary"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: shade(C.lblue),
              margins: { top: 160, bottom: 160, left: 180, right: 180 },
              children: [
                para(
                  run(
                    "lp.homeup.sg has improved sharply since the 7 June baseline (+11 combined points). Page-level SEO is now strong: unique titles and meta descriptions, canonical URLs, Open Graph and Twitter cards, JSON-LD (Organization, WebSite, FAQPage, HowTo, SpeakableSpecification), an /about page with NAP data, question-style H2s, a GST-aware pricing comparison table, and plain-language FAQs. The biggest remaining gap is infrastructure: the live sitemap.xml still lists only four URLs (home, buy, listings, playbook) while /sell, /about, agent profiles, and sub-landing pages are live but omitted. Live robots.txt still serves Crawl-delay: 10 even though the codebase removed it. Fixing those two deploy files and submitting the full sitemap to Google Search Console is the highest-impact next step.",
                    { size: 11 },
                  ),
                ),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  children.push(para(run(" "), { before: 120, after: 0 }));

  const scoreRows = [
    [
      " SEO",
      SCORES.seo,
      "Strong on-page metadata and schema; stale sitemap and crawl-delay hold the score back.",
    ],
    [
      " GEO",
      SCORES.geo,
      "Named CEA agents, office NAP, parent entity (Haus Plus UEN), and review schema give AI engines citable facts.",
    ],
    [
      " AEO",
      SCORES.aeo,
      "FAQ/HowTo/Speakable markup, pricing definition, and comparison table support snippets and voice.",
    ],
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [hCell("Dimension"), hCell("Score"), hCell("Status"), hCell("Key Takeaway")],
        }),
        ...scoreRows.map(([dim, score, takeaway], i) => {
          const bg = i % 2 === 0 ? C.white : C.lgray;
          return new TableRow({
            children: [
              dCell(dim, bg, { bold: true, center: true }),
              dCell(`${score}/10`, scoreColor(score), {
                bold: true,
                color: C.white,
                center: true,
              }),
              new TableCell({
                shading: shade(scoreColor(score)),
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [
                  para(run(scoreStatus(score), { bold: true, color: C.white }), {
                    align: AlignmentType.CENTER,
                  }),
                ],
              }),
              dCell(takeaway, bg),
            ],
          });
        }),
        new TableRow({
          children: [
            dCell("Combined", C.lgray, { bold: true, center: true }),
            dCell(`${COMBINED}/30`, C.green, { bold: true, color: C.white, center: true }),
            new TableCell({ shading: shade(C.lgray), children: [para(run(""))] }),
            dCell(`Up from ${BASELINE.combined}/30 on 7 June 2026`, C.lgray),
          ],
        }),
      ],
    }),
  );

  children.push(heading1("Pages Audited"));
  const pageData = [
    ["lp.homeup.sg/", "Homepage", "Full JSON-LD stack; Speakable + FAQ; 6-listing preview; Last updated June 2026"],
    ["lp.homeup.sg/about", "About / E-E-A-T", "NAP, C&H + Haus Plus entity copy, team CTA, stats"],
    ["lp.homeup.sg/sell", "Sell hub", "Pricing section, HowTo FAQ schema, fee explainer, comparison table"],
    ["lp.homeup.sg/sell-hdb", "Sell HDB", "Type-specific FAQ + process timeline; em dashes in body copy"],
    ["lp.homeup.sg/sell-condo", "Sell condo", "SSD/EC FAQs; comparison table; em dashes in hero/process"],
    ["lp.homeup.sg/buy", "Buy hub", "Complimentary vs paid packages; buying calculator; FAQ section"],
    ["lp.homeup.sg/buy-hdb", "Buy HDB", "Grant/loan FAQs; fixed $1,999 fee messaging"],
    ["lp.homeup.sg/listings", "Listings index", "123 listings; strong intro paragraph; filters"],
    ["lp.homeup.sg/agents/dennis-lim", "Agent profile", "Person schema expected; CEA number; YouTube embed"],
    ["lp.homeup.sg/privacy-policy", "Legal", "PDPA notice; entity clarification"],
    ["lp.homeup.sg/robots.txt", "Crawl config", "Allow all; Sitemap declared; Crawl-delay: 10 still live"],
    ["lp.homeup.sg/sitemap.xml", "Sitemap", "HTTP 200 but only 4 URLs listed; missing sell/about/agents"],
  ];
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [hCell("URL"), hCell("Page Type"), hCell("Notes")],
        }),
        ...pageData.map(([url, type, notes], i) => {
          const bg = i % 2 === 0 ? C.white : C.lgray;
          return new TableRow({
            children: [dCell(url, bg, { color: C.blue }), dCell(type, bg, { bold: true }), dCell(notes, bg)],
          });
        }),
      ],
    }),
  );

  children.push(heading1(`SEO Analysis — ${SCORES.seo}/10  On Track`));
  children.push(heading2("Technical On-Page"));
  children.push(
    findingTable([
      [
        "Title tags",
        'Homepage: "Fixed-Fee Property Agents Singapore | HomeUP". /about, /sell, /buy, /listings each have unique keyword titles with Singapore context.',
        "Good",
      ],
      [
        "Meta descriptions",
        "Detected on homepage HTML. Custom descriptions via buildPageMetadata on all major LP routes.",
        "Good",
      ],
      [
        "Canonical tags",
        "Self-referencing canonical on homepage (https://lp.homeup.sg/). Implemented sitewide in metadata layer.",
        "Good",
      ],
      [
        "Open Graph / Twitter",
        "og:title, og:description, og:image, twitter:card detected on homepage.",
        "Good",
      ],
      [
        "H1 structure",
        'Homepage H1: "Sell Your Home for More. Save on Commissions." Single primary H1; logical H2 hierarchy below.',
        "Good",
      ],
      [
        "Sitemap.xml",
        "Live file returns 200 but lists only 4 URLs (/, /buy, /listings, /playbook). Codebase sitemap.ts defines 20+ routes including /sell, /about, agent pages. Crawlers may miss most of the site.",
        "Needs Attention",
      ],
      [
        "robots.txt",
        "Live file still includes Crawl-delay: 10. Repo robots.ts removed crawl-delay. Stale deploy or FTP not overwriting root files.",
        "Needs Attention",
      ],
      [
        "Subdomain (lp.)",
        "Site remains on lp.homeup.sg. Brand authority on homeup.sg does not consolidate automatically. Architectural constraint unless 301 strategy is defined.",
        "Needs Attention",
      ],
      [
        "Internal linking",
        "Nav includes About, Buy, Sell, Listings, Agents. Footer links to privacy and about. Homepage listings CTA to /listings.",
        "Good",
      ],
    ]),
  );

  children.push(heading2("Content Quality"));
  children.push(
    findingTable([
      [
        "Pricing transparency",
        "$1,999 / $4,999 / $9,999 before GST with GST-inclusive savings table and statutory 2% footnote.",
        "Good",
      ],
      [
        "Word count / depth",
        "Homepage, sell, buy, and listings pages each exceed 800 words of substantive copy plus FAQs.",
        "Good",
      ],
      [
        "Freshness signals",
        '"Last updated: June 2026" visible on homepage, about, buy, sell, listings.',
        "Good",
      ],
      [
        "Readability",
        "Section headings, cards, comparison table, accordion FAQs. Homepage listing preview capped at 6 cards (deployed).",
        "Good",
      ],
      [
        "Copy consistency",
        'Mixed "HomeUP" and "HOMEUP" casing persists in UI. Some public pages still use em dashes (e.g. /about, /sell-hdb) against style rules.',
        "Needs Attention",
      ],
    ]),
  );

  children.push(heading2("Structured Data"));
  children.push(
    findingTable([
      [
        "Organization + LocalBusiness",
        "RealEstateAgent, Organization, parentOrganization (Haus Plus UEN), address, opening hours, AggregateRating, Review array on homepage.",
        "Good",
      ],
      [
        "WebSite schema",
        "Sitewide WebSite publisher linked to organization @id.",
        "Good",
      ],
      [
        "FAQPage",
        "Homepage, sell, buy, and sub-landing pages emit FAQPage JSON-LD from lib/data/faqs.ts.",
        "Good",
      ],
      [
        "HowTo",
        "Sell journey HowTo on homepage and sell routes.",
        "Good",
      ],
      [
        "SpeakableSpecification",
        "WebPage speakable cssSelector for .speakable-fixed-fee-definition and .speakable-faq-answer on homepage.",
        "Good",
      ],
      [
        "BreadcrumbList",
        "Present on homepage; breadcrumb gaps remain on some sub-landing pages (known backlog).",
        "Needs Attention",
      ],
    ]),
  );

  children.push(heading1(`GEO Analysis — ${SCORES.geo}/10  Strong`));
  children.push(heading2("E-E-A-T Assessment"));
  children.push(
    findingTable([
      [
        "Named agents + CEA",
        "Six advisors with photos and registration numbers. Agency C & H Properties L3007139C stated in footer and about.",
        "Good",
      ],
      [
        "Physical NAP",
        "About page lists 125A Lor 2 Toa Payoh #02-138, Singapore 311125 and +65 8087 7015.",
        "Good",
      ],
      [
        "Parent entity",
        "Haus Plus Pte. Ltd. UEN 202538756D in schema, about, privacy (no residential address shown).",
        "Good",
      ],
      [
        "Reviews / social proof",
        "Four named testimonials on homepage; AggregateRating in Organization schema.",
        "Good",
      ],
      [
        "External citations",
        "Limited links to CEA, HDB, or SLA to substantiate process claims. Adding 2 to 3 authoritative outbound links would strengthen GEO.",
        "Needs Attention",
      ],
    ]),
  );

  children.push(heading2("Content for AI Synthesis"));
  children.push(
    findingTable([
      [
        "Factual density",
        "Fixed fees, transaction counts, grant amounts, SSD rates, timeline weeks, CPF rules in FAQs.",
        "Good",
      ],
      [
        "Entity clarity",
        "Operating agency vs brand owner distinction is explicit in about and privacy copy.",
        "Good",
      ],
      [
        "Original claims",
        '"1,000+ transactions", "$200M+ transacted", "120+ active listings" with listing count on /listings (123).',
        "Good",
      ],
      [
        "Comprehensiveness",
        "Sell-and-buy, HDB portal, ABSD, and new launch balloting covered across FAQ sets.",
        "Good",
      ],
    ]),
  );

  children.push(heading2("Technical GEO"));
  children.push(
    findingTable([
      ["HTTPS", "Site served over HTTPS.", "Good"],
      [
        "sameAs social profiles",
        "Instagram, TikTok, Facebook, YouTube in Organization schema and footer.",
        "Good",
      ],
      [
        "AI crawler access",
        "No Disallow rules. Crawl-delay: 10 on live robots.txt may slow non-Google bots.",
        "Needs Attention",
      ],
      [
        "JS-dependent content",
        "SavingsSlider uses client JS; noscript static fallback present in pricing section.",
        "Good",
      ],
    ]),
  );

  children.push(heading1(`AEO Analysis — ${SCORES.aeo}/10  Strong`));
  children.push(heading2("Featured Snippet Eligibility"));
  children.push(
    findingTable([
      [
        "Question headings",
        '"How much does a property agent cost in Singapore?" and "What is a fixed-fee property agent?" on homepage.',
        "Good",
      ],
      [
        "Definition paragraph",
        "Fixed-fee definition block in #pricing with speakable CSS class.",
        "Good",
      ],
      [
        "Comparison table",
        "HTML table with HDB / Condo / Landed example savings; mobile card fallback.",
        "Good",
      ],
      [
        "Direct FAQ answers",
        "Seven homepage FAQs rewritten in plain language; accordion UI (answers in DOM + FAQ schema).",
        "Good",
      ],
    ]),
  );

  children.push(heading2("Structured Answer Formats"));
  children.push(
    findingTable([
      ["FAQ schema", "Homepage + sell + buy + type-specific FAQ sets.", "Good"],
      ["HowTo schema", "Four-step sell process on homepage and sell pages.", "Good"],
      ["Speakable schema", "SpeakableSpecification on homepage WebPage.", "Good"],
      [
        "Standalone FAQ hub",
        "/faq route not deployed (skipped by project choice). FAQ content lives on landing pages instead.",
        "Needs Attention",
      ],
    ]),
  );

  children.push(heading2("Voice Search Readiness"));
  children.push(
    findingTable([
      [
        "Conversational FAQs",
        "Plain-language answers without contractions; suitable for read-aloud.",
        "Good",
      ],
      [
        "Long-tail coverage",
        "Fees, fixed-fee definition, sell-and-buy timing, HDB CPF return, ABSD, grants addressed.",
        "Good",
      ],
      [
        "Local signals",
        "Singapore throughout; NAP on about; area names in listings.",
        "Good",
      ],
    ]),
  );

  children.push(heading1("Priority Recommendations"));
  const priorityColor = {
    Critical: C.red,
    High: C.orange,
    Medium: C.amber,
    "Quick Win": C.green,
  };
  const recs = [
    [
      "Critical",
      "Fix live sitemap.xml deploy so all 20+ routes from sitemap.ts appear (currently only 4 URLs)",
      "SEO",
      "Low",
      "Very High",
    ],
    [
      "Critical",
      "Overwrite live robots.txt to remove Crawl-delay: 10 (matches repo robots.ts)",
      "SEO",
      "Low",
      "High",
    ],
    [
      "High",
      "Submit corrected sitemap in Google Search Console and monitor index coverage",
      "SEO",
      "Low",
      "High",
    ],
    [
      "High",
      "Audit FTP deploy for root files (sitemap.xml, robots.txt) not updating on push",
      "SEO",
      "Medium",
      "High",
    ],
    [
      "Medium",
      "Remove remaining em dashes from /about and sell/buy sub-page body copy",
      "SEO / GEO",
      "Low",
      "Medium",
    ],
    [
      "Medium",
      "Add BreadcrumbList JSON-LD to sell-hdb, sell-condo, buy-hdb sub-landings",
      "SEO",
      "Low",
      "Medium",
    ],
    [
      "Medium",
      "Standardise brand casing to HomeUP in UI strings",
      "GEO",
      "Low",
      "Low",
    ],
    [
      "Medium",
      "Add 2 to 3 outbound links to CEA / HDB official pages where process claims are made",
      "GEO",
      "Low",
      "Medium",
    ],
    [
      "Quick Win",
      "Run PageSpeed Insights on homepage and /listings for Core Web Vitals baseline",
      "SEO",
      "Low",
      "Medium",
    ],
    [
      "Quick Win",
      "Exclude /playbook from sitemap until WIP page is ready for indexation",
      "SEO",
      "Low",
      "Low",
    ],
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [hCell("Priority"), hCell("Issue"), hCell("Dimension"), hCell("Effort"), hCell("Impact")],
        }),
        ...recs.map(([priority, issue, dim, effort, impact], i) => {
          const bg = i % 2 === 0 ? C.white : C.lgray;
          return new TableRow({
            children: [
              new TableCell({
                shading: shade(priorityColor[priority]),
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  para(run(priority, { bold: true, color: C.white, size: 9 }), {
                    align: AlignmentType.CENTER,
                  }),
                ],
              }),
              dCell(issue, bg),
              dCell(dim, bg, { bold: true, center: true, size: 9 }),
              dCell(effort, bg, { center: true, size: 9 }),
              dCell(impact, bg, { center: true, size: 9 }),
            ],
          });
        }),
      ],
    }),
  );

  children.push(heading1("What's Working Well"));
  const strengths = [
    [
      "Massive score gain vs 7 June",
      `Combined score ${COMBINED}/30 vs ${BASELINE.combined}/30 after metadata, schema, /about, FAQs, and pricing work.`,
    ],
    [
      "Rich JSON-LD on homepage",
      "Organization, WebSite, FAQPage, HowTo, SpeakableSpecification verified in live HTML.",
    ],
    [
      "GST-standardised pricing table",
      "Comparison table with footnoted 2% commission citation supports trust and snippet eligibility.",
    ],
    [
      "/about E-E-A-T page",
      "Office address, phone hours, parent UEN, and operating agency clearly disclosed.",
    ],
    [
      "Plain-language FAQs",
      "Rewritten FAQ sets across homepage, sell, and buy with schema sync.",
    ],
    [
      "Homepage UX for SEO scroll depth",
      "Listings preview capped at 6 with filters; primary CTA to /listings.",
    ],
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [hCell("Strength"), hCell("Evidence from Crawl")],
        }),
        ...strengths.map(([strength, evidence], i) => {
          const bg = i % 2 === 0 ? C.lgreen : C.white;
          return new TableRow({
            children: [dCell(strength, bg, { bold: true }), dCell(evidence, bg)],
          });
        }),
      ],
    }),
  );

  children.push(heading1("Glossary"));
  children.push(
    para(
      run(
        "SEO (Search Engine Optimization): Traditional search visibility through titles, content, links, and technical crawlability.",
      ),
    ),
  );
  children.push(
    para(
      run(
        "GEO (Generative Engine Optimization): Structuring factual, authoritative content so AI search tools (Perplexity, ChatGPT Search, Google AI Overviews) can cite your brand accurately.",
      ),
    ),
  );
  children.push(
    para(
      run(
        "AEO (Answer Engine Optimization): Formatting content and schema for featured snippets, People Also Ask, and voice assistants using direct answers, FAQs, and Speakable markup.",
      ),
    ),
  );

  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.navy } },
            children: [
              new TextRun({ text: DOMAIN, font: "Arial", size: 18, bold: true, color: C.dark }),
              new TextRun({
                text: "\t\tSEO / GEO / AEO Audit Report",
                font: "Arial",
                size: 18,
                color: C.attrib,
              }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.mgray } },
            children: [
              new TextRun({
                text: "Claude Skill and Plugin by Alex Labat",
                font: "Arial",
                size: 18,
                color: C.attrib,
              }),
              new TextRun({ text: "\t\t", font: "Arial", size: 18 }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: "Arial",
                size: 18,
                color: C.dark,
              }),
            ],
          }),
        ],
      }),
    },
    children,
  };
}

const doc = new Document({ sections: [makeCoverSection(), makeMainSection()] });
const docxPath = path.join(ROOT, "seo-audit-lp-homeup-sg-2026-06-14.docx");

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(docxPath, buffer);
console.log("DOCX written:", docxPath);
