import { SITE_URL } from "@/lib/seo/constants";

export const MCP_SERVER_CARD_PATH = "/.well-known/mcp/server-card.json";
export const MCP_SERVER_CARD_URL = `${SITE_URL}${MCP_SERVER_CARD_PATH}`;
export const MCP_ENDPOINT = `${SITE_URL}/api/mcp`;

export function buildMcpServerCard() {
  return {
    serverInfo: {
      name: "HomeUP Listings",
      version: "1.0.0",
      description: "Public property listings and search for Singapore HDB, condo, and landed homes.",
    },
    transport: {
      type: "streamable-http",
      endpoint: MCP_ENDPOINT,
    },
    capabilities: {
      tools: {
        listChanged: false,
      },
      resources: {
        subscribe: false,
        listChanged: false,
      },
      prompts: {
        listChanged: false,
      },
    },
    tools: [
      {
        name: "search_listings",
        description: "Search active HomeUP property listings with optional filters.",
      },
      {
        name: "get_listing",
        description: "Get a single active listing by slug.",
      },
    ],
    links: {
      openapi: `${SITE_URL}/openapi.json`,
      api_catalog: `${SITE_URL}/.well-known/api-catalog`,
      listings_html: `${SITE_URL}/listings`,
    },
  };
}
