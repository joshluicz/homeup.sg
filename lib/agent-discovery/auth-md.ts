import { SITE_URL } from "@/lib/seo/constants";

export const AUTH_MD_PATH = "/auth.md";
export const AUTH_MD_URL = `${SITE_URL}${AUTH_MD_PATH}`;

const OAUTH_AUTHORIZATION_SERVER_URL = `${SITE_URL}/.well-known/oauth-authorization-server`;
const OPENID_CONFIGURATION_URL = `${SITE_URL}/.well-known/openid-configuration`;
const OAUTH_PROTECTED_RESOURCE_URL = `${SITE_URL}/.well-known/oauth-protected-resource`;

export function buildAgentAuthBlock() {
  return {
    skill: AUTH_MD_URL,
    register_uri: `${AUTH_MD_URL}#registration`,
    identity_types_supported: ["anonymous", "identity_assertion"],
    anonymous: {
      credential_types_supported: ["none"],
      claim_uri: `${AUTH_MD_URL}#claim`,
    },
    identity_assertion: {
      assertion_types_supported: ["urn:ietf:params:oauth:token-type:id-jag", "verified_email"],
      credential_types_supported: ["bearer"],
      claim_uri: `${AUTH_MD_URL}#claim`,
      revocation_uri: `${AUTH_MD_URL}#revocation`,
      events_supported: ["credential_revoked"],
    },
  };
}

export function buildAuthMdDocument(): string {
  return `# HomeUP auth.md

Agent authentication and registration for HomeUP Singapore property APIs.

## Audience

AI agents and automated clients that read public listing data or integrate with HomeUP admin APIs.

## Public APIs (no authentication)

These endpoints do not require registration or credentials:

- \`GET ${SITE_URL}/api/public/listings\`
- \`GET ${SITE_URL}/api/public/listings/{slug}\`

OpenAPI: ${SITE_URL}/openapi.json

## Protected APIs

Admin routes under \`${SITE_URL}/api/admin\` require a Supabase OAuth access token obtained through the authorization server below.

Send \`Authorization: Bearer <access_token>\` on each request.

## OAuth discovery

- Protected resource metadata (RFC 9728): ${OAUTH_PROTECTED_RESOURCE_URL}
- Authorization server (RFC 8414): ${OAUTH_AUTHORIZATION_SERVER_URL}
- OpenID Connect discovery: ${OPENID_CONFIGURATION_URL}
- API catalog: ${SITE_URL}/.well-known/api-catalog

## Registration {#registration}

**Public listing data:** No registration is required. Call the public JSON API directly.

**Admin APIs:** Human operators sign in at ${SITE_URL}/admin/login with Supabase Auth (email). Programmatic agent registration for admin scopes is not open. Contact HomeUP at +65 8087 7015 or WhatsApp for partnership access.

Supported identity types for discovery:

- \`anonymous\` — public listings API (no credential)
- \`identity_assertion\` — bearer tokens from the OAuth authorization server for protected admin APIs

## Claim {#claim}

Public API usage requires no credential claim.

For protected APIs, present a valid bearer token issued by an advertised authorization server. Tokens are validated against the JWKS URI in OAuth metadata.

## Revocation {#revocation}

Revoke Supabase sessions through the authorization server \`revocation_endpoint\` documented in ${OAUTH_AUTHORIZATION_SERVER_URL}.

Supported revocation events: \`credential_revoked\`.
`;
}
