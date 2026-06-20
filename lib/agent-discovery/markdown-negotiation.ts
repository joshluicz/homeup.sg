import { NextResponse } from "next/server";
import { getListingBySlugServer, getActiveListingsServer } from "@/lib/listings/server-queries";
import { formatListingPrice } from "@/lib/listings/public-utils";
import { SITE_URL, CEA_LICENSE, LEGAL_NAME } from "@/lib/seo/constants";

/** Rough token estimate for x-markdown-tokens (chars / 4). */
export function estimateMarkdownTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4);
}

export function wantsMarkdown(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/markdown");
}

export function markdownResponse(markdown: string): NextResponse {
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
      "Cache-Control": "public, max-age=300",
      "x-markdown-tokens": String(estimateMarkdownTokens(markdown)),
    },
  });
}

const STATIC_PAGES: Record<string, () => string> = {
  "/": () => `# Fixed-Fee Property Agents Singapore | HomeUP

HomeUP helps Singapore homeowners sell for more with a transparent fixed fee.

## Fixed fees (before GST)

- HDB: $1,999
- Condo / EC: $4,999
- Landed: $9,999

## Track record

- 1,000+ transactions closed
- 860+ HDB · 260+ condo and landed
- 7 CEA-licensed agents

## Links

- [About](${SITE_URL}/about)
- [Sell](${SITE_URL}/sell)
- [Buy](${SITE_URL}/buy)
- [Listings](${SITE_URL}/listings)
- [Agents](${SITE_URL}/agents)
`,

  "/about": () => `# About HomeUP

HomeUP is a Singapore property advisory with transparent fixed fees and named CEA-licensed advisors.

## Company

- Operating agency: ${LEGAL_NAME}
- CEA licence: ${CEA_LICENSE}
- Parent company: Haus Plus Pte. Ltd. (UEN 202538756D)
- Office: 125A Lor 2 Toa Payoh #02-138, Singapore 311125
- Phone: +65 8087 7015

## Fixed fees (before GST)

- HDB from $1,999
- Condo / EC from $4,999
- Landed from $9,999
`,

  "/sell": () => `# Sell your property with HomeUP

Fixed-fee selling for HDB, condo, and landed property in Singapore.

- [Sell HDB](${SITE_URL}/sell-hdb) — $1,999 + GST
- [Sell Condo](${SITE_URL}/sell-condo) — $4,999 + GST
- [Sell Landed](${SITE_URL}/sell-landed) — $9,999 + GST
`,

  "/buy": () => `# Buy with HomeUP

Buyer representation for Singapore property purchases.

- [Buy HDB](${SITE_URL}/buy-hdb)
- [Buy Condo / Landed](${SITE_URL}/buy-condo-landed)
- [Buy New Launch](${SITE_URL}/buy-new-launch)
`,

  "/listings": () => "", // filled dynamically
};

export async function getMarkdownForPath(pathname: string): Promise<string | null> {
  if (pathname.startsWith("/listings/") && pathname !== "/listings/") {
    const slug = pathname.replace(/^\/listings\//, "").replace(/\/$/, "");
    if (!slug || slug === "_") return null;
    const listing = await getListingBySlugServer(slug);
    if (!listing) return null;
    const price = formatListingPrice(listing);
    return `# ${listing.title}

${listing.address_line_1 ?? "Singapore"}

**Price:** ${price}

- Type: ${listing.flat_type}
- Listed as: ${listing.listed_as}
${listing.rooms != null ? `- Bedrooms: ${listing.rooms}` : ""}
${listing.bathrooms != null ? `- Bathrooms: ${listing.bathrooms}` : ""}
${listing.area_sqft ? `- Area: ${listing.area_sqft} sqft` : ""}

[View listing](${SITE_URL}/listings/${listing.slug})
`;
  }

  if (pathname === "/listings") {
    const listings = await getActiveListingsServer(30);
    const lines = listings.map(
      (l) =>
        `- [${l.title}](${SITE_URL}/listings/${l.slug}) — ${formatListingPrice(l)}${l.address_line_1 ? ` · ${l.address_line_1}` : ""}`,
    );
    return `# Property Listings Singapore

Browse ${listings.length} active listings (showing up to 30).

${lines.join("\n")}

[All listings](${SITE_URL}/listings)
`;
  }

  const staticPage = STATIC_PAGES[pathname];
  if (staticPage) {
    const content = staticPage();
    return content || null;
  }

  // Sub-landing pages share parent markdown where useful
  if (pathname.startsWith("/sell-")) return STATIC_PAGES["/sell"]?.() ?? null;
  if (pathname.startsWith("/buy-")) return STATIC_PAGES["/buy"]?.() ?? null;

  return null;
}
