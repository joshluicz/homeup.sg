import { SITE_URL } from "@/lib/seo/constants";

export const OPENID_CONFIGURATION_PATH = "/.well-known/openid-configuration";
export const OAUTH_AUTHORIZATION_SERVER_PATH = "/.well-known/oauth-authorization-server";

export const OPENID_CONFIGURATION_URL = `${SITE_URL}${OPENID_CONFIGURATION_PATH}`;
export const OAUTH_AUTHORIZATION_SERVER_URL = `${SITE_URL}${OAUTH_AUTHORIZATION_SERVER_PATH}`;

/** Supabase Auth v1 base, e.g. https://project.supabase.co/auth/v1 */
export function getSupabaseAuthBase(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url) return null;
  return `${url}/auth/v1`;
}

/**
 * OAuth 2.0 authorization server metadata (RFC 8414).
 * Auth is provided by Supabase; discovery is published on homeup.sg for agents.
 */
export function buildOAuthAuthorizationServerMetadata() {
  const authBase = getSupabaseAuthBase();
  if (!authBase) return null;

  return {
    issuer: SITE_URL,
    authorization_endpoint: `${authBase}/authorize`,
    token_endpoint: `${authBase}/token`,
    jwks_uri: `${authBase}/.well-known/jwks.json`,
    revocation_endpoint: `${authBase}/logout`,
    userinfo_endpoint: `${authBase}/userinfo`,
    service_documentation: `${SITE_URL}/llms.txt`,
    api_catalog_uri: `${SITE_URL}/.well-known/api-catalog`,
    scopes_supported: ["openid", "email", "profile"],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    code_challenge_methods_supported: ["S256"],
    protected_resources: [
      {
        resource: `${SITE_URL}/api/admin`,
        description: "Admin listing and playbook APIs. Requires a Supabase access token.",
      },
    ],
    public_resources: [
      {
        resource: `${SITE_URL}/api/public/listings`,
        description: "Active property listings. No authentication required.",
      },
      {
        resource: `${SITE_URL}/api/public/listings/{slug}`,
        description: "Single listing by slug. No authentication required.",
      },
    ],
  };
}

/** OpenID Connect discovery metadata (OpenID Connect Discovery 1.0). */
export function buildOpenIdConfigurationMetadata() {
  const oauth = buildOAuthAuthorizationServerMetadata();
  if (!oauth) return null;

  return {
    ...oauth,
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256", "HS256"],
  };
}

export const OAUTH_DISCOVERY_CACHE_CONTROL = "public, max-age=3600";
