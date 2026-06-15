import type {
  PropertyGuruExtraction,
  PropertyGuruExtractionRaw,
} from "./types.ts";
import {
  coerceInteger,
  coerceNumber,
  normalizeCondition,
  normalizeFlatType,
  normalizeListedAs,
  normalizeNegotiable,
} from "./types.ts";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You extract property listing data from PropertyGuru Singapore listing page HTML.
Return ONLY valid JSON with no markdown, no preamble, no explanation.

Use this exact schema (all fields optional; use null if unknown):
{
  "title": string | null,
  "listed_as": "rent" | "sell" | null,
  "price": number | null,
  "negotiable": "negotiable" | "starting_from" | null,
  "area_sqft": number | null,
  "flat_type": "condominium" | "hdb" | "landed" | "apartment" | null,
  "condition": "no_furnishing" | "partial" | "fully_furnished" | null,
  "rooms": number | null,
  "bathrooms": number | null,
  "tenure": number | null,
  "is_freehold": boolean | null,
  "address_line_1": string | null
}

Rules:
- price: SGD amount as integer (no currency symbols)
- area_sqft: floor area in square feet; convert from sqm if needed (1 sqm ≈ 10.764 sqft)
- listed_as: "rent" for rental listings, "sell" for sale listings
- flat_type: map PropertyGuru property type to one of the four allowed values
- is_freehold: true if tenure is freehold; tenure years in "tenure" when leasehold
- Do not invent data; use null when not found in the HTML`;

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonResponse(text: string): PropertyGuruExtractionRaw {
  const attempts = [text, stripJsonFences(text)];
  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt) as PropertyGuruExtractionRaw;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("Failed to parse Claude response as JSON");
}

export function normalizeExtraction(
  raw: PropertyGuruExtractionRaw,
  urlHint?: string,
): PropertyGuruExtraction {
  const isFreehold = raw.is_freehold === true;

  return {
    title: raw.title?.trim() || null,
    listed_as: normalizeListedAs(raw.listed_as ?? undefined, urlHint),
    price: coerceInteger(raw.price),
    negotiable: normalizeNegotiable(raw.negotiable ?? undefined),
    area_sqft: coerceNumber(raw.area_sqft),
    flat_type: normalizeFlatType(raw.flat_type ?? undefined),
    condition: normalizeCondition(raw.condition ?? undefined),
    rooms: coerceInteger(raw.rooms),
    bathrooms: coerceInteger(raw.bathrooms),
    tenure: isFreehold ? null : coerceInteger(raw.tenure),
    is_freehold: isFreehold,
    address_line_1: raw.address_line_1?.trim() || null,
  };
}

export async function extractWithClaude(
  cleanedHtml: string,
  urlHint?: string,
): Promise<PropertyGuruExtraction> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: cleanedHtml }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Claude API error (${response.status}): ${detail.slice(0, 200)}`);
  }

  const message = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const textBlock = message.content?.find((block) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error("Claude returned no text content");
  }

  const raw = parseJsonResponse(textBlock.text);
  return normalizeExtraction(raw, urlHint);
}
