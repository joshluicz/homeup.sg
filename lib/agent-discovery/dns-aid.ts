import { SITE_URL } from "@/lib/seo/constants";

/** Canonical hostname for DNS-AID SVCB/HTTPS targets (no scheme, no trailing dot). */
export const DNS_AID_TARGET = new URL(SITE_URL).hostname;

/** DNS-AID HTTPS records to publish under the zone (Cloudflare type: HTTPS). */
export const DNS_AID_HTTPS_RECORDS = [
  {
    name: "_index._agents",
    description: "Organization agent discovery entry point (RFC draft DNS-AID §3.2)",
    data: {
      priority: 1,
      target: DNS_AID_TARGET,
      value: 'alpn="h2,h3" port="443" mandatory="alpn,port"',
    },
  },
  {
    name: "_catalog._https._agents",
    description: "HTTPS agent for the public API catalog and listings API",
    data: {
      priority: 1,
      target: DNS_AID_TARGET,
      value: 'alpn="h2,h3" port="443" mandatory="alpn,port"',
    },
  },
] as const;

/** TXT index for dns-aid tooling (single-query agent list). */
export const DNS_AID_INDEX_TXT = {
  name: "_index._agents",
  content: "agents=catalog:https",
} as const;

export const AGENT_INDEX_PATH = "/.well-known/agent-index.json";

export const AGENT_INDEX = {
  version: "1.0",
  domain: DNS_AID_TARGET,
  agents: [
    {
      fqdn: `_catalog._https._agents.${DNS_AID_TARGET}`,
      name: "catalog",
      protocol: "https",
      endpoint: SITE_URL,
      description: "Public property listings and API catalog for HomeUP Singapore",
      capabilities: ["listings", "property-search"],
      links: {
        "api-catalog": `${SITE_URL}/.well-known/api-catalog`,
        "openid-configuration": `${SITE_URL}/.well-known/openid-configuration`,
        "oauth-authorization-server": `${SITE_URL}/.well-known/oauth-authorization-server`,
        "llms-txt": `${SITE_URL}/llms.txt`,
      },
    },
  ],
} as const;
