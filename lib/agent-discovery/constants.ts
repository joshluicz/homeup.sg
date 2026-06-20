import { SITE_URL } from "@/lib/seo/constants";
import {
  OAUTH_AUTHORIZATION_SERVER_PATH,
  OPENID_CONFIGURATION_PATH,
} from "@/lib/agent-discovery/oauth-discovery";

export const API_CATALOG_PATH = "/.well-known/api-catalog";
export const API_CATALOG_URL = `${SITE_URL}${API_CATALOG_PATH}`;

/** RFC 8288 Link header value for the homepage (comma-separated link-values). */
export const HOMEPAGE_LINK_HEADER = [
  `<${API_CATALOG_PATH}>; rel="api-catalog"`,
  `<${OPENID_CONFIGURATION_PATH}>; rel="openid-configuration"`,
  `<${OAUTH_AUTHORIZATION_SERVER_PATH}>; rel="oauth-authorization-server"`,
  `</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"`,
  `</.well-known/mcp/server-card.json>; rel="mcp-server-card"`,
  `</.well-known/agent-skills/index.json>; rel="agent-skills"`,
  `</auth.md>; rel="auth-md"; type="text/markdown"`,
  `</llms.txt>; rel="describedby"; type="text/plain"`,
].join(", ");

/**
 * RFC 9727 API catalog using RFC 9264 linkset+json format.
 * Each entry anchors to an API base URL; relation types are keys per RFC 9264 §4.2.
 */
export const API_CATALOG_LINKSET = {
  linkset: [
    {
      anchor: `${SITE_URL}/api/public`,
      "service-desc": [
        {
          href: `${SITE_URL}/openapi.json`,
          type: "application/openapi+json",
        },
      ],
      "service-doc": [
        {
          href: `${SITE_URL}/listings`,
          type: "text/html",
        },
      ],
      status: [
        {
          href: `${SITE_URL}/api/health/supabase`,
        },
      ],
    },
  ],
} as const;

export const API_CATALOG_CONTENT_TYPE =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';
