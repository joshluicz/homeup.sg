import {
  FETCH_BLOCK_PATTERNS,
  PG_USER_AGENT,
} from "./types.ts";

export type FetchResult =
  | { ok: true; html: string }
  | { ok: false; error: "FETCH_BLOCKED" | string };

export function validatePropertyGuruUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Invalid URL";
  }

  if (!parsed.hostname.endsWith("propertyguru.com.sg")) {
    return "URL must be a propertyguru.com.sg listing";
  }

  if (!parsed.pathname.includes("/listing/")) {
    return "URL must point to a specific listing page (path contains /listing/)";
  }

  return null;
}

function isBlockedBody(body: string): boolean {
  return FETCH_BLOCK_PATTERNS.some((pattern) => pattern.test(body));
}

export async function fetchListingPage(url: string): Promise<FetchResult> {
  const validationError = validatePropertyGuruUrl(url);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": PG_USER_AGENT,
        "Accept-Language": "en-SG,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    const body = await res.text();

    if (!res.ok || isBlockedBody(body)) {
      return { ok: false, error: "FETCH_BLOCKED" };
    }

    return { ok: true, html: body };
  } catch {
    return { ok: false, error: "FETCH_BLOCKED" };
  }
}
