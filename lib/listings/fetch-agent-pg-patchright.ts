import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTS } from "@/lib/data/agents";
import {
  extractListingUrlsFromHtml,
  mergeParsedListings,
  parseListingHrefs,
} from "@/lib/listings/extract-pg-listing-urls";
import { parsePgAgentSourceInput, type ParsedPgListingUrl } from "@/lib/listings/pg-url";
import type { Page } from "patchright";

const LISTING_RE = /\/listing\/[a-z0-9-]+-(\d+)/gi;
const MAX_PAGES = 40;
const MODES = ["property-for-sale", "property-for-rent"] as const;

type PgMode = (typeof MODES)[number];

type AgentProfileRow = {
  agent_slug: string;
  pg_profile_url: string | null;
  pg_listed_by_id: string | null;
};

export type PerAgentModeResult = {
  listedById: string;
  agent_slug: string;
  agent_name: string;
  mode: PgMode;
  found: number;
  new: number;
  error?: string;
};

export type PatchrightFetchResult = {
  perAgentMode: PerAgentModeResult[];
  totalNew: number;
};

function profileDir(): string {
  return process.env.PG_PROFILE_DIR ?? path.join(process.cwd(), ".pg-profile");
}

function pgWaitMs(): number {
  const raw = process.env.PG_WAIT ?? "180000";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 180_000;
}

function emptySettleMs(): number {
  const raw = process.env.PG_EMPTY_SETTLE_MS ?? "12000";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 12_000;
}

type PageReadyStatus = "listings" | "empty" | "timeout";

function randomDelayMs(): number {
  return 1500 + Math.floor(Math.random() * 2501);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getListedById(profile: AgentProfileRow): string | null {
  if (profile.pg_listed_by_id?.trim()) return profile.pg_listed_by_id.trim();
  if (profile.pg_profile_url?.trim()) {
    return parsePgAgentSourceInput(profile.pg_profile_url)?.pg_listed_by_id ?? null;
  }
  return null;
}

function isSearchJsonResponse(url: string): boolean {
  if (!url.includes("propertyguru.com.sg")) return false;
  if (/google|facebook|analytics|sentry|hotjar|segment|optimizely|datadog/i.test(url)) {
    return false;
  }
  return /search|listing|property|srp|graphql|api|bff/i.test(url);
}

async function clearAgentSources(supabase: SupabaseClient, agentSlug: string): Promise<void> {
  const { error } = await supabase.from("pg_listing_sources").delete().eq("agent_slug", agentSlug);
  if (error) throw new Error(error.message);
}

async function isChallengeVisible(page: Page): Promise<boolean> {
  const title = await page.title();
  if (/just a moment/i.test(title)) return true;
  return (await page.locator('iframe[src*="challenges.cloudflare.com"]').count()) > 0;
}

async function canProceed(page: Page, blobs: string[]): Promise<boolean> {
  if ((await page.locator('a[href*="/listing/"]').count()) > 0) return true;
  const combined = blobs.join("");
  LISTING_RE.lastIndex = 0;
  return LISTING_RE.test(combined);
}

async function hasNoResults(page: Page): Promise<boolean> {
  return page
    .evaluate(() => {
      const body = document.body?.innerText ?? "";
      const patterns = [
        /no listings found/i,
        /no results found/i,
        /no properties found/i,
        /no property found/i,
        /0 listings/i,
        /0 properties/i,
        /0 results/i,
        /showing\s*0/i,
        /couldn't find any/i,
        /could not find any/i,
        /did not find any/i,
        /we can't find/i,
        /we could not find/i,
        /no matching/i,
      ];
      return patterns.some((re) => re.test(body));
    })
    .catch(() => false);
}

async function isEmptySearchResultsPage(page: Page): Promise<boolean> {
  if (await canProceed(page, [])) return false;
  if (await hasNoResults(page)) return true;

  return page
    .evaluate(() => {
      const listingLinks = document.querySelectorAll('a[href*="/listing/"]').length;
      if (listingLinks > 0) return false;
      if (/just a moment/i.test(document.title)) return false;
      if (document.querySelector('iframe[src*="challenges.cloudflare.com"]')) return false;
      if (document.querySelector('[aria-busy="true"]')) return false;

      const url = location.href;
      if (!url.includes("listedById=")) return false;

      const mainText = document.querySelector("main")?.textContent ?? document.body?.innerText ?? "";
      if (mainText.length < 80) return false;

      return /property-for-(sale|rent)/i.test(url);
    })
    .catch(() => false);
}

async function waitForPageReady(
  page: Page,
  blobs: string[],
  label: string,
): Promise<PageReadyStatus> {
  const deadline = Date.now() + pgWaitMs();
  let loggedChallenge = false;
  let noChallengeSince = Date.now();

  while (Date.now() < deadline) {
    if (await canProceed(page, blobs)) return "listings";

    if (await isChallengeVisible(page)) {
      noChallengeSince = Date.now();
      if (!loggedChallenge) {
        console.warn(`[patchright] Challenge visible for ${label} — solve in browser window`);
        loggedChallenge = true;
      }
      await sleep(2000);
      continue;
    }

    const noChallengeMs = Date.now() - noChallengeSince;

    if (noChallengeMs >= 3000 && (await hasNoResults(page))) {
      console.info(`[patchright] Empty results page: ${label}`);
      return "empty";
    }

    if (noChallengeMs >= emptySettleMs() && (await isEmptySearchResultsPage(page))) {
      console.info(`[patchright] No listings on settled page: ${label}`);
      return "empty";
    }

    await sleep(2000);
  }

  if (await canProceed(page, blobs)) return "listings";
  if ((await hasNoResults(page)) || (await isEmptySearchResultsPage(page))) return "empty";
  return "timeout";
}

async function extractPageListings(page: Page, blobs: string[]): Promise<Map<string, ParsedPgListingUrl>> {
  const hrefsFiltered = await page
    .$$eval('main a[href*="/listing/"]', (anchors) =>
      anchors
        .map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? "")
        .filter((href) => href.includes("/listing/"))
        .filter((_, i) => {
          const a = anchors[i] as HTMLAnchorElement;
          return !a.closest("nav, footer, header, aside");
        }),
    )
    .catch(() => [] as string[]);

  const nextData = await page
    .evaluate(() => document.getElementById("__NEXT_DATA__")?.textContent ?? "")
    .catch(() => "");

  const fromDom = parseListingHrefs(hrefsFiltered);
  const fromNext = nextData ? extractListingUrlsFromHtml(nextData) : [];
  const fromJson = blobs.flatMap((blob) => extractListingUrlsFromHtml(blob));

  return mergeParsedListings(fromDom, fromNext, fromJson);
}

async function loadExistingKeys(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from("pg_listing_sources").select("pg_url, pg_listing_id");
  if (error) throw new Error(error.message);

  const keys = new Set<string>();
  for (const row of data ?? []) {
    if (row.pg_url) keys.add(row.pg_url as string);
    if (row.pg_listing_id) keys.add(`id:${row.pg_listing_id}`);
  }
  return keys;
}

async function insertListingSource(
  supabase: SupabaseClient,
  agentSlug: string,
  listing: { pg_url: string; pg_listing_id: string },
  existingKeys: Set<string>,
): Promise<boolean> {
  if (existingKeys.has(listing.pg_url) || existingKeys.has(`id:${listing.pg_listing_id}`)) {
    return false;
  }

  const { error } = await supabase.from("pg_listing_sources").insert({
    agent_slug: agentSlug,
    pg_url: listing.pg_url,
    pg_listing_id: listing.pg_listing_id,
  });

  if (error) {
    if (error.code === "23505") {
      existingKeys.add(listing.pg_url);
      existingKeys.add(`id:${listing.pg_listing_id}`);
      return false;
    }
    throw new Error(error.message);
  }

  existingKeys.add(listing.pg_url);
  existingKeys.add(`id:${listing.pg_listing_id}`);
  return true;
}

type EnabledAgent = {
  slug: string;
  name: string;
  listedById: string;
};

export async function fetchPgListingsWithPatchright(
  supabase: SupabaseClient,
  onlyAgentSlug?: string,
): Promise<PatchrightFetchResult> {
  const { data, error: profilesError } = await supabase
    .from("pg_agent_profiles")
    .select("agent_slug, pg_profile_url, pg_listed_by_id");

  if (profilesError) throw new Error(profilesError.message);

  const profileBySlug = new Map(
    ((data ?? []) as AgentProfileRow[]).map((row) => [row.agent_slug, row]),
  );

  const agentsToProcess = onlyAgentSlug
    ? AGENTS.filter((a) => a.slug === onlyAgentSlug)
    : AGENTS;

  const enabledAgents: EnabledAgent[] = [];
  const perAgentMode: PerAgentModeResult[] = [];

  for (const agent of agentsToProcess) {
    const profile = profileBySlug.get(agent.slug);
    const listedById = profile ? getListedById(profile) : null;
    if (!listedById) {
      for (const mode of MODES) {
        perAgentMode.push({
          listedById: "",
          agent_slug: agent.slug,
          agent_name: agent.name,
          mode,
          found: 0,
          new: 0,
          error: "No listedById saved",
        });
      }
      continue;
    }
    enabledAgents.push({ slug: agent.slug, name: agent.name, listedById });
  }

  if (enabledAgents.length === 0) {
    return { perAgentMode, totalNew: 0 };
  }

  const { chromium } = await import("patchright");

  const ctx = await chromium.launchPersistentContext(profileDir(), {
    channel: "chrome",
    headless: false,
    viewport: null,
  });

  const blobs: string[] = [];
  const page = await ctx.newPage();

  page.on("response", async (response) => {
    if (!isSearchJsonResponse(response.url())) return;
    const contentType = response.headers()["content-type"] ?? "";
    if (!contentType.includes("json")) return;
    try {
      blobs.push(await response.text());
    } catch {
      // ignore truncated or binary responses
    }
  });

  let totalNew = 0;

  try {
    for (const agent of enabledAgents) {
      await clearAgentSources(supabase, agent.slug);
      const existingKeys = await loadExistingKeys(supabase);
      const seenPerAgent = new Set<string>();

      for (const mode of MODES) {
        let found = 0;
        let newCount = 0;
        let modeError: string | undefined;

        for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
          const url = `https://www.propertyguru.com.sg/${mode}?listedById=${encodeURIComponent(agent.listedById)}&page=${pageNum}`;
          const label = `${agent.name} ${mode} page ${pageNum}`;

          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });

          const ready = await waitForPageReady(page, blobs, label);
          if (ready === "timeout") {
            modeError = `Timed out waiting for listings: ${label}`;
            break;
          }
          if (ready === "empty") break;

          const extracted = await extractPageListings(page, blobs);
          blobs.length = 0;

          let newOnPage = 0;
          for (const listing of extracted.values()) {
            if (seenPerAgent.has(listing.pg_listing_id)) continue;
            seenPerAgent.add(listing.pg_listing_id);
            found += 1;
            newOnPage += 1;

            const inserted = await insertListingSource(supabase, agent.slug, listing, existingKeys);
            if (inserted) {
              newCount += 1;
              totalNew += 1;
            }
          }

          if (newOnPage === 0) break;

          await sleep(randomDelayMs());
        }

        perAgentMode.push({
          listedById: agent.listedById,
          agent_slug: agent.slug,
          agent_name: agent.name,
          mode,
          found,
          new: newCount,
          error: modeError,
        });
      }
    }
  } finally {
    await ctx.close();
  }

  return { perAgentMode, totalNew };
}
