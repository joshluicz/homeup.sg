"use client";

import { useEffect } from "react";

interface McpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
}

interface ModelContext extends EventTarget {
  registerTool(tool: McpTool, options?: { signal?: AbortSignal }): Promise<void>;
}

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
  interface Document {
    modelContext?: ModelContext;
  }
}

function getModelContext(): ModelContext | undefined {
  if (typeof navigator !== "undefined" && navigator.modelContext) {
    return navigator.modelContext;
  }
  if (typeof document !== "undefined" && document.modelContext) {
    return document.modelContext;
  }
  return undefined;
}

const PAGE_ROUTES: Record<string, string> = {
  home: "/",
  buy: "/buy",
  sell: "/sell",
  listings: "/listings",
  agents: "/agents",
};

export function WebMCPProvider() {
  useEffect(() => {
    const mc = getModelContext();
    if (!mc) return;

    const controller = new AbortController();
    const opts = { signal: controller.signal };

    const tools: McpTool[] = [
      {
        name: "search_listings",
        title: "Search Property Listings",
        description:
          "Search active HDB and condo property listings in Singapore. Supports filtering by listing type, flat type, price range, and featured status. Returns paginated results.",
        inputSchema: {
          type: "object",
          properties: {
            listed_as: {
              type: "string",
              enum: ["buy", "rent"],
              description: "Filter by transaction type",
            },
            flat_type: {
              type: "string",
              description: "HDB flat type, e.g. '4-room' or '5-room'",
            },
            min_price: { type: "number", description: "Minimum price in SGD" },
            max_price: { type: "number", description: "Maximum price in SGD" },
            is_featured: { type: "boolean", description: "Only featured listings" },
            page: { type: "integer", default: 1, minimum: 1 },
          },
        },
        execute: async (input) => {
          const params = new URLSearchParams();
          if (input.listed_as) params.set("listed_as", String(input.listed_as));
          if (input.flat_type) params.set("flat_type", String(input.flat_type));
          if (input.min_price != null) params.set("min_price", String(input.min_price));
          if (input.max_price != null) params.set("max_price", String(input.max_price));
          if (input.is_featured != null) params.set("is_featured", String(input.is_featured));
          if (input.page != null) params.set("page", String(input.page));
          const res = await fetch(`/api/public/listings?${params}`);
          if (!res.ok) throw new Error(`search_listings: HTTP ${res.status}`);
          return res.json();
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: "get_listing",
        title: "Get Listing Details",
        description:
          "Retrieve full details of a specific property listing by its URL slug, including price, flat type, area, price-per-sqft, and agent info.",
        inputSchema: {
          type: "object",
          properties: {
            slug: { type: "string", description: "The listing's URL slug" },
          },
          required: ["slug"],
        },
        execute: async ({ slug }) => {
          const res = await fetch(
            `/api/public/listings/${encodeURIComponent(String(slug))}`,
          );
          if (!res.ok) throw new Error(`get_listing: HTTP ${res.status}`);
          return res.json();
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: "navigate_to_page",
        title: "Navigate to Page",
        description:
          "Navigate to a section of the HomeUP website: home, buy (buying guide), sell (selling packages), listings (all properties), or agents (meet the team).",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "string",
              enum: ["home", "buy", "sell", "listings", "agents"],
              description: "Which page to open",
            },
          },
          required: ["page"],
        },
        execute: async ({ page }) => {
          const path = PAGE_ROUTES[String(page)] ?? "/";
          window.location.href = path;
          return { navigated: true, path };
        },
      },
    ];

    Promise.all(tools.map((t) => mc.registerTool(t, opts))).catch(
      (err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          console.warn("WebMCP tool registration failed:", err);
        }
      },
    );

    return () => controller.abort();
  }, []);

  return null;
}
