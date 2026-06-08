// SEO/GEO/AEO Audit Report Generator — lp.homeup.sg
const docx = require('C:/Users/joshl/AppData/Local/Temp/node_modules/docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak
} = docx;
const fs = require('fs');

// ── Constants ──────────────────────────────────────────────────────────────
const DOMAIN     = 'lp.homeup.sg';
const AUDIT_DATE = '7 June 2026';
const SCORES     = { seo: 4, geo: 5, aeo: 3 };
const COMBINED   = SCORES.seo + SCORES.geo + SCORES.aeo;

const C = {
  navy:   '1B2A4A', blue:   '2563EB', green:  '16A34A', amber:  'D97706',
  red:    'DC2626', orange: 'EA580C', lgray:  'F8F9FA', mgray:  'E2E8F0',
  dark:   '1E293B', lblue:  'EFF6FF', lgreen: 'F0FDF4', ltblue: '93C5FD',
  attrib: '94A3B8', white:  'FFFFFF',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function scoreColor(s)  { return s >= 8 ? C.green : s >= 5 ? C.amber : C.red; }
function scoreStatus(s) { return s >= 8 ? 'Strong' : s >= 5 ? 'On Track' : 'Needs Work'; }
function shade(fill)    { return { type: ShadingType.SOLID, fill, color: fill }; }

const BORDERS = {
  top:     { style: BorderStyle.SINGLE, size: 4, color: C.mgray },
  bottom:  { style: BorderStyle.SINGLE, size: 4, color: C.mgray },
  left:    { style: BorderStyle.SINGLE, size: 4, color: C.mgray },
  right:   { style: BorderStyle.SINGLE, size: 4, color: C.mgray },
  insideH: { style: BorderStyle.SINGLE, size: 2, color: C.mgray },
  insideV: { style: BorderStyle.SINGLE, size: 2, color: C.mgray },
};
const NO_BORDERS = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
  insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
};

function run(text, opts = {}) {
  return new TextRun({
    text, font: 'Arial',
    size:    (opts.size   || 11) * 2,
    bold:    opts.bold    || false,
    italics: opts.italic  || false,
    color:   opts.color   || C.dark,
  });
}

function para(runs, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing:   { before: opts.before || 0, after: opts.after || 100 },
    children:  Array.isArray(runs) ? runs : [runs],
  });
}

function hCell(text, bg = C.navy) {
  return new TableCell({
    shading: shade(bg),
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [para(run(text, { bold: true, color: C.white, size: 10 }), { align: AlignmentType.CENTER })],
  });
}

function dCell(text, bg, opts = {}) {
  return new TableCell({
    shading: shade(bg),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [para(run(text, opts), { align: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT })],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 36, bold: true, color: C.navy })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: C.dark })],
  });
}

// ── Finding table (Signal | Finding | Status) ──────────────────────────────
function findingTable(rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [hCell('Signal'), hCell('Finding'), hCell('Status')],
  });

  const dataRows = rows.map(([signal, finding, status], i) => {
    const bg      = i % 2 === 0 ? C.white : C.lgray;
    const statusBg = status === 'Good' ? C.green : status === 'Needs Attention' ? C.amber : C.red;
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
          children: [para(run(status, { bold: true, color: C.white }), { align: AlignmentType.CENTER })],
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

// ── Cover page ─────────────────────────────────────────────────────────────
function makeCoverSection() {
  // Score cells for cover
  const scoreCells = ['SEO', 'GEO', 'AEO'].map((label, i) => {
    const s = [SCORES.seo, SCORES.geo, SCORES.aeo][i];
    return new TableCell({
      shading: shade(scoreColor(s)),
      margins: { top: 200, bottom: 120, left: 120, right: 120 },
      children: [
        para(run(label, { bold: true, color: C.white, size: 10 }), { align: AlignmentType.CENTER, after: 40 }),
        para(run(String(s), { bold: true, color: C.white, size: 36 }), { align: AlignmentType.CENTER, after: 40 }),
        para(run(scoreStatus(s), { italic: true, color: C.white, size: 9 }), { align: AlignmentType.CENTER, after: 80 }),
      ],
    });
  });

  const scoreTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [new TableRow({ children: scoreCells })],
  });

  const navyPara = () => new Paragraph({
    shading: shade(C.navy),
    spacing: { after: 0 },
    children: [run(' ')],
  });

  return {
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [
      ...Array(9).fill(null).map(() => navyPara()),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: DOMAIN, font: 'Arial', size: 72, bold: true, color: C.white })],
      }),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: 'SEO / GEO / AEO Audit Report', font: 'Arial', size: 36, color: C.ltblue })],
      }),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: 'QUICK AUDIT', font: 'Arial', size: 22, color: C.white })],
      }),
      scoreTable,
      ...Array(9).fill(null).map(() => navyPara()),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: AUDIT_DATE, font: 'Arial', size: 18, color: C.attrib })],
      }),
      new Paragraph({
        shading: shade(C.navy),
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [new TextRun({ text: 'Claude Skill and Plugin by Alex Labat', font: 'Arial', size: 18, color: C.attrib })],
      }),
      new Paragraph({ children: [new PageBreak()] }),
    ],
  };
}

// ── Main section ───────────────────────────────────────────────────────────
function makeMainSection() {
  const children = [];

  // ── EXECUTIVE SUMMARY ──────────────────────────────────────────────────
  children.push(heading1('Executive Summary'));

  // Summary box
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [new TableRow({
      children: [new TableCell({
        shading: shade(C.lblue),
        margins: { top: 160, bottom: 160, left: 180, right: 180 },
        children: [para(run(
          'lp.homeup.sg is a Singapore fixed-fee real estate agency with genuinely strong content — specific pricing ($1,999/$4,999/$9,999), named CEA-licensed agents (agency registration L3007139C), and $200M+ in transacted volume give AI search engines real, citable facts. However, four critical technical gaps block search performance: no XML sitemap, a 10-second crawl-delay throttling bots, no meta descriptions on any page, and zero structured data schema. The most important structural issue is running the main site on an "lp." subdomain rather than homeup.sg — Google treats it as a separate entity, splitting all SEO authority. Addressing these technical foundations first would yield rapid, measurable ranking improvements.',
          { size: 11 }
        ))],
      })],
    })],
  }));

  children.push(para(run(' '), { before: 120, after: 0 }));

  // Scores summary table
  const scoreRows = [
    [' SEO', SCORES.seo, 'No sitemap, no meta descriptions, no OG tags — crawlability and SERP click-through are unaddressed.'],
    [' GEO', SCORES.geo, 'Good factual density and named credentials, but no Organization schema or physical NAP data.'],
    [' AEO', SCORES.aeo, 'No FAQ schema, no question-phrased headings, no snippet-optimised content on any page.'],
  ];

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [hCell('Dimension'), hCell('Score'), hCell('Status'), hCell('Key Takeaway')],
      }),
      ...scoreRows.map(([dim, score, takeaway], i) => {
        const bg = i % 2 === 0 ? C.white : C.lgray;
        return new TableRow({
          children: [
            dCell(dim, bg, { bold: true, center: true }),
            dCell(`${score}/10`, scoreColor(score), { bold: true, color: C.white, center: true }),
            new TableCell({
              shading: shade(scoreColor(score)),
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [para(run(scoreStatus(score), { bold: true, color: C.white }), { align: AlignmentType.CENTER })],
            }),
            dCell(takeaway, bg),
          ],
        });
      }),
      new TableRow({
        children: [
          dCell('Combined', C.lgray, { bold: true, center: true }),
          dCell(`${COMBINED}/30`, C.amber, { bold: true, color: C.white, center: true }),
          new TableCell({ shading: shade(C.lgray), children: [para(run(''))] }),
          new TableCell({ shading: shade(C.lgray), children: [para(run(''))] }),
        ],
      }),
    ],
  }));

  // ── PAGES AUDITED ──────────────────────────────────────────────────────
  children.push(heading1('Pages Audited'));
  const pageData = [
    ['lp.homeup.sg',              'Homepage',        'H1 present; meta description not detected; no schema markup; social links in footer'],
    ['lp.homeup.sg/buy',          'Buying Services', 'Title: "Buying Services | HomeUP"; H1 present; no meta description detected'],
    ['lp.homeup.sg/robots.txt',   'Crawl Config',    'Crawl-delay: 10 set; no Disallow rules; no Sitemap reference'],
    ['lp.homeup.sg/sitemap.xml',  'Sitemap',         '404 Not Found — sitemap does not exist'],
    ['lp.homeup.sg/property-listing/', 'Listings',   '404 Not Found — broken route or page removed'],
  ];
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows: [
      new TableRow({ tableHeader: true, children: [hCell('URL'), hCell('Page Type'), hCell('Notes')] }),
      ...pageData.map(([url, type, notes], i) => {
        const bg = i % 2 === 0 ? C.white : C.lgray;
        return new TableRow({
          children: [
            dCell(url, bg, { color: C.blue }),
            dCell(type, bg, { bold: true }),
            dCell(notes, bg),
          ],
        });
      }),
    ],
  }));

  // ── SEO ANALYSIS ───────────────────────────────────────────────────────
  children.push(heading1(`SEO Analysis — ${SCORES.seo}/10  Needs Work`));
  children.push(heading2('Technical On-Page'));
  children.push(findingTable([
    ['Subdomain (lp.)',     'Site runs on lp.homeup.sg rather than homeup.sg. Google treats subdomains as separate sites — brand searches and backlinks earned by homeup.sg do not transfer to this subdomain.',                                                                  'Needs Attention'],
    ['Title tag',          '/buy confirmed: "Buying Services | HomeUP". Homepage title not captured by fetch but likely present via Next.js. Both pages missing Singapore location keyword.',                                                                                  'Needs Attention'],
    ['Meta description',   'Not detected on homepage or /buy. SERP listings will auto-generate snippets from body text, significantly reducing click-through rate.',                                                                                                           'Missing'],
    ['H1',                 'Homepage: "Sell Your Home for More. Save on Commissions." — strong, keyword-relevant. /buy: "Buy with a clear plan. Not guesswork." — differentiated. Both solid.',                                                                               'Good'],
    ['Heading hierarchy',  'Homepage: 8 H2s covering pricing, savings, testimonials, agents, social. /buy: 11 H2s. Both logical and keyword-varied.',                                                                                                                         'Good'],
    ['Canonical tag',      'Not detected on any page. Without canonicals, potential duplicate content between lp.homeup.sg and homeup.sg could cause indexing issues.',                                                                                                       'Missing'],
    ['Open Graph tags',    'No og:title, og:description, or og:image detected on any page. Every social media share renders as a plain URL with no preview card.',                                                                                                            'Missing'],
    ['Image alt text',     'Team photo alt: "The HomeUP team, five agents giving thumbs up." Agent and portal logo images also have alt attributes — solid accessibility foundation.',                                                                                         'Good'],
    ['Robots meta',        'Not detected — defaults to index, follow. No accidental noindex directives found.',                                                                                                                                                               'Good'],
    ['Internal links',     'Good nav structure: Home, Pricing, Buy, Our Team. WhatsApp CTA consistent across all pages.',                                                                                                                                                    'Good'],
    ['Sitemap.xml',        '404 Not Found. Search engines have no structured map of the site\'s pages. Critical for a multi-page Next.js deployment.',                                                                                                                        'Missing'],
    ['robots.txt delay',   'Crawl-delay: 10 set. Googlebot ignores this directive but Bing, Perplexity, and other AI crawlers wait 10 seconds between requests — severely slowing indexation.',                                                                               'Needs Attention'],
  ]));

  children.push(heading2('Content Quality'));
  children.push(findingTable([
    ['Value proposition',    '"Most Singapore homeowners give away $10,000–$70,000 in commission. HomeUP charges a fixed fee." Clear, specific, competitive differentiation.',                                         'Good'],
    ['Pricing transparency', '$1,999 HDB / $4,999 Condo / $9,999 Landed — exact fixed pricing is rare in this market and a strong trust signal.',                                                                   'Good'],
    ['Word count',           'Estimated 800–1,200 words on homepage across hero, pricing, savings, testimonials, agent, social sections. Substantial enough for SEO.',                                               'Good'],
    ['Keyword signals',      '"Singapore property", "fixed fee agent", "HDB seller", "property commission" naturally present in headings and body across both pages.',                                               'Good'],
    ['Content freshness',    'No publication or update dates visible. "Top 3 Producer 2025" implies currency but provides no date signal for crawlers.',                                                             'Needs Attention'],
    ['Readability',          'Scannable: short paragraphs, section headings, pricing cards, feature lists. Good mobile-first content structure.',                                                                     'Good'],
  ]));

  children.push(heading2('Structured Data'));
  children.push(findingTable([
    ['Schema markup',          'No JSON-LD or microdata detected on any fetched page. The entire site has zero structured data.',                                                  'Missing'],
    ['Organization schema',    'No schema declaring HomeUP as a business entity (name, logo, URL, contact, social profiles).',                                                     'Missing'],
    ['LocalBusiness schema',   'No LocalBusiness or RealEstateAgent schema. Google cannot confirm this is a licensed Singapore property agency.',                                  'Missing'],
    ['FAQ schema',             'No FAQ markup. Pricing and process questions on the page are not eligible for rich results in SERPs.',                                             'Missing'],
    ['Review schema',          'Testimonials exist on the homepage but are not marked up — cannot appear as star ratings in search results.',                                      'Missing'],
  ]));

  // ── GEO ANALYSIS ───────────────────────────────────────────────────────
  children.push(heading1(`GEO Analysis — ${SCORES.geo}/10  Needs Work`));
  children.push(heading2('E-E-A-T Assessment'));
  children.push(findingTable([
    ['Named agents & CEA',   '5 agents named with photos: Dennis Lim, Yeo Tong Boon, Edmund Lee, Kenji Ching, Olivia Neo. Agency: C & H Properties, CEA L3007139C. Strong verifiable authority signal.',           'Good'],
    ['Transaction authority', '"1,000+ transactions closed", "$200M+ real estate transacted", "Top 3 Producer in Agency (2025)" — quantified, specific authority claims that AI engines can cite.',                'Good'],
    ['Physical address',     'No office address found on any page. AI search engines use NAP (Name, Address, Phone) data to verify business legitimacy.',                                                            'Missing'],
    ['Contact options',      'WhatsApp only (wa.me/6580877015). No phone number or email address visible — limits trust signal diversity for AI engines.',                                                           'Needs Attention'],
    ['About page',           'No standalone About or Team page discovered. Agent bios on homepage are good but a dedicated company history page strengthens E-E-A-T.',                                              'Needs Attention'],
    ['Organization schema',  'No schema declaring the brand entity. AI engines cannot programmatically confirm HomeUP\'s website, logo, or social profile links.',                                                  'Missing'],
  ]));

  children.push(heading2('Content for AI Synthesis'));
  children.push(findingTable([
    ['Factual density',     'Strong: exact dollar figures, transaction counts, agent names, agency credentials — the specific facts AI engines prefer to cite in synthesised answers.',                              'Good'],
    ['Clear value claim',   '"HomeUP charges a fixed fee for the same full service" stated plainly at the top of the page. AI assistants can extract this as a direct answer to user queries.',                   'Good'],
    ['Entity consistency',  'Brand referred to as both "HomeUP" and "HOMEUP" across pages. Minor inconsistency can confuse knowledge graph entity matching.',                                                       'Needs Attention'],
    ['External citations',  'No links to HDB, CEA, or SLA to substantiate claims. AI engines prefer content that cites verifiable external authoritative sources.',                                                'Needs Attention'],
    ['Original data',       '"1,000+ transactions" and "$200M+ transacted" are unique, specific claims. A CEA records citation would make these highly citable original data points.',                              'Good'],
    ['Comprehensiveness',   'Selling and buying processes not explained step-by-step. Visitors arriving via AI search may leave with unanswered procedural questions.',                                            'Needs Attention'],
  ]));

  children.push(heading2('Technical GEO'));
  children.push(findingTable([
    ['HTTPS',              'Site uses HTTPS — standard trust signal for AI crawlers and search engines.',                                                                                                             'Good'],
    ['Social profile links', 'Instagram, TikTok, Facebook, YouTube linked in footer — multi-platform presence that strengthens brand entity graph.',                                                               'Good'],
    ['Structured data',    'No schema of any type. AI engines cannot programmatically identify the business, its services, or its agents.',                                                                         'Missing'],
    ['AI crawler access',  'No Disallow rules blocking content. Crawl-delay: 10 may slow Perplexity bot and similar AI crawlers beyond Googlebot.',                                                                'Needs Attention'],
    ['SameAs links',       'Social profiles linked from the site but not declared in Organization schema SameAs property — partial entity signal only.',                                                           'Needs Attention'],
  ]));

  // ── AEO ANALYSIS ───────────────────────────────────────────────────────
  children.push(heading1(`AEO Analysis — ${SCORES.aeo}/10  Needs Work`));
  children.push(heading2('Featured Snippet Eligibility'));
  children.push(findingTable([
    ['Question headings',      'No H2 or H3 on any page uses question format. Zero snippet trigger points for "how much does a property agent cost?" or "what is a fixed-fee agent?".',                            'Missing'],
    ['Direct answer paras',    'No 40–60 word answer paragraph positioned directly below a question heading on any page.',                                                                                          'Missing'],
    ['Definition patterns',    'No "HomeUP is a fixed-fee property agency that…" definition sentence. AI assistants cannot extract a clean entity definition.',                                                    'Missing'],
    ['Pricing table',          'Three-tier pricing table (HDB / Condo / Landed) is well-structured — strong candidate for a table featured snippet once schema markup is added.',                                  'Good'],
    ['List content',           'Service features exist in card format but not marked up as ul/ol HTML lists — limits snippet extraction by search engines.',                                                       'Needs Attention'],
  ]));

  children.push(heading2('Structured Answer Formats'));
  children.push(findingTable([
    ['FAQ schema',         'No FAQ markup on any page. Common questions (fees, CEA licensing, HDB process, timeline) not structured for rich results.',                                                              'Missing'],
    ['HowTo schema',       'No HowTo markup. A "How our fixed-fee service works" or "How to sell your HDB flat" HowTo would be high-value for both Google and voice search.',                                     'Missing'],
    ['Question headings',  '11 H2s on /buy but none use question format. "Support that fits your situation" could become "What support do I get when buying property in Singapore?"',                              'Needs Attention'],
    ['Speakable schema',   'No SpeakableSpecification markup. Voice assistants cannot identify preferred read-aloud sections of the page.',                                                                         'Missing'],
  ]));

  children.push(heading2('Voice Search Readiness'));
  children.push(findingTable([
    ['Conversational language',  'Homepage and /buy use natural, readable language — a good foundation for voice search adaptation.',                                                                               'Good'],
    ['Long-tail questions',      'No explicit coverage of: "How much does a property agent cost in Singapore?", "Can I sell my HDB without an agent?", "What is a fixed-fee property agent?"',                    'Missing'],
    ['Local signals',            '"Singapore" appears in content but no physical address, no area-specific landing pages, and no LocalBusiness schema.',                                                           'Needs Attention'],
    ['NAP data',                 'No Name/Address/Phone discoverable on any page. WhatsApp (6580877015) is the only contact — insufficient for local SEO and voice search.',                                      'Missing'],
  ]));

  // ── PRIORITY RECOMMENDATIONS ───────────────────────────────────────────
  children.push(heading1('Priority Recommendations'));
  const priorityColor = { Critical: C.red, High: C.orange, Medium: C.amber, 'Quick Win': C.green };
  const recs = [
    ['Critical',  'Create sitemap.xml and submit to Google Search Console',                                    'SEO',        'Low',    'Very High'],
    ['Critical',  'Remove Crawl-delay: 10 from robots.txt',                                                    'SEO',        'Low',    'High'],
    ['Critical',  'Add meta descriptions to all pages (homepage, /buy, etc.)',                                 'SEO',        'Low',    'High'],
    ['Critical',  'Migrate site to homeup.sg root domain (or 301 redirect homeup.sg to lp.homeup.sg now)',    'SEO',        'High',   'Very High'],
    ['High',      'Add Open Graph and Twitter Card meta tags to all pages',                                    'SEO',        'Low',    'Medium'],
    ['High',      'Implement Organization + RealEstateAgent JSON-LD schema on homepage',                       'GEO / AEO',  'Medium', 'High'],
    ['High',      'Add FAQ schema with 8–10 common buyer/seller questions and answers',                        'AEO',        'Medium', 'High'],
    ['High',      'Add self-referencing canonical tags to all pages',                                          'SEO',        'Low',    'Medium'],
    ['Medium',    'Add physical office address to footer and create LocalBusiness schema',                     'GEO / AEO',  'Medium', 'Medium'],
    ['Medium',    'Add phone number and email contact options alongside WhatsApp',                             'GEO',        'Low',    'Medium'],
    ['Medium',    'Standardise brand name to "HomeUP" consistently across all pages',                          'GEO',        'Low',    'Low'],
    ['Medium',    'Rephrase 3–5 H2 headings on /buy as questions to trigger featured snippets',               'AEO',        'Low',    'Medium'],
    ['Quick Win', 'Add og:image using the team photo for social sharing previews',                             'SEO',        'Low',    'Medium'],
    ['Quick Win', 'Add "Singapore" to title tags ("Fixed-Fee Property Agent Singapore | HomeUP")',             'SEO',        'Low',    'Medium'],
    ['Quick Win', 'Add Review/AggregateRating schema to existing homepage testimonials',                       'AEO',        'Low',    'Medium'],
  ];

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [hCell('Priority'), hCell('Issue'), hCell('Dimension'), hCell('Effort'), hCell('Impact')],
      }),
      ...recs.map(([priority, issue, dim, effort, impact], i) => {
        const bg = i % 2 === 0 ? C.white : C.lgray;
        return new TableRow({
          children: [
            new TableCell({
              shading: shade(priorityColor[priority]),
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [para(run(priority, { bold: true, color: C.white, size: 9 }), { align: AlignmentType.CENTER })],
            }),
            dCell(issue, bg),
            dCell(dim, bg, { bold: true, center: true, size: 9 }),
            dCell(effort, bg, { center: true, size: 9 }),
            dCell(impact, bg, { center: true, size: 9 }),
          ],
        });
      }),
    ],
  }));

  // ── WHAT'S WORKING WELL ────────────────────────────────────────────────
  children.push(heading1("What's Working Well"));
  const strengths = [
    ['Specific, citable pricing',      '$1,999/$4,999/$9,999 fixed fees — exact numbers AI engines can cite as direct answers to "how much does a property agent cost in Singapore?"'],
    ['Named, credentialed agents',     'Dennis Lim, Yeo Tong Boon, Edmund Lee, Kenji Ching, Olivia Neo — all named with photos and CEA agency affiliation (L3007139C). Strong E-E-A-T.'],
    ['Quantified authority claims',    '"1,000+ transactions closed", "$200M+ transacted", "Top 3 Producer 2025" — specific, verifiable authority claims that competitors rarely match.'],
    ['Strong H1 on all pages',         'Homepage: "Sell Your Home for More. Save on Commissions." /buy: "Buy with a clear plan." Both keyword-focused, differentiated, and compelling.'],
    ['Testimonials structure',         'Testimonials section present on homepage; agent profile photos; consistent WhatsApp CTA — conversion-optimised layout throughout.'],
    ['Multi-platform social presence', 'Instagram, TikTok, Facebook, YouTube all linked — strengthens brand entity graph signals for AI search engines mapping the brand.'],
    ['Descriptive image alt text',     'Team photo and agent images have descriptive alt attributes — solid accessibility and image SEO foundation already in place.'],
    ['Clean crawl access',             'No Disallow rules blocking important content — all pages are theoretically accessible once crawl-delay is removed from robots.txt.'],
  ];

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows: [
      new TableRow({ tableHeader: true, children: [hCell('Strength'), hCell('Evidence from Crawl')] }),
      ...strengths.map(([strength, evidence], i) => {
        const bg = i % 2 === 0 ? C.lgreen : C.white;
        return new TableRow({
          children: [
            dCell(strength, bg, { bold: true }),
            dCell(evidence, bg),
          ],
        });
      }),
    ],
  }));

  // ── Section header/footer ──────────────────────────────────────────────
  return {
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.navy } },
          children: [
            new TextRun({ text: DOMAIN, font: 'Arial', size: 18, bold: true, color: C.dark }),
            new TextRun({ text: '\t\tSEO / GEO / AEO Audit Report', font: 'Arial', size: 18, color: C.attrib }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.mgray } },
          children: [
            new TextRun({ text: 'Claude Skill and Plugin by Alex Labat', font: 'Arial', size: 18, color: C.attrib }),
            new TextRun({ text: '\t\t', font: 'Arial', size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: C.dark }),
          ],
        })],
      }),
    },
    children,
  };
}

// ── Build & write ──────────────────────────────────────────────────────────
const doc = new Document({
  sections: [makeCoverSection(), makeMainSection()],
});

const outPath = 'C:/Users/joshl/OneDrive/Documents/Programming/homeup/seo-audit-lp-homeup-sg-2026-06-07.docx';

Packer.toBuffer(doc)
  .then(buf => {
    fs.writeFileSync(outPath, buf);
    console.log('DOCX written: ' + outPath);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
