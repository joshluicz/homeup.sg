import { SITE_URL } from "@/lib/seo/constants";

export const AUTH_MD_PATH = "/auth.md";
export const AUTH_MD_URL = `${SITE_URL}${AUTH_MD_PATH}`;

const OAUTH_AUTHORIZATION_SERVER_URL = `${SITE_URL}/.well-known/oauth-authorization-server`;
const OPENID_CONFIGURATION_URL = `${SITE_URL}/.well-known/openid-configuration`;
const OAUTH_PROTECTED_RESOURCE_URL = `${SITE_URL}/.well-known/oauth-protected-resource`;

/** auth.md agent_auth block for OAuth Authorization Server metadata (RFC 8414). */
export function buildAgentAuthBlock() {
  return {
    skill: AUTH_MD_URL,
    register_uri: `${AUTH_MD_URL}#registration`,
    claim_uri: `${AUTH_MD_URL}#claim`,
    revocation_uri: `${AUTH_MD_URL}#revocation`,
    identity_types_supported: ["anonymous", "identity_assertion"],
    anonymous: {
      credential_types_supported: ["none"],
    },
    identity_assertion: {
      assertion_types_supported: ["urn:ietf:params:oauth:token-type:id-jag", "verified_email"],
      credential_types_supported: ["bearer"],
    },
    events_supported: ["credential_revoked"],
  };
}

export function buildAuthMdDocument(): string {
  return `# auth.md

You are an agent. HomeUP supports **agentic registration** for its Singapore property APIs: discover metadata, register (or skip registration for public data), present credentials on protected routes, and revoke when instructed.

Resource server: \`${SITE_URL}\`  
Authorization server: \`${SITE_URL}\` (Supabase Auth for protected admin APIs)

## Step 1 — Discover

1. Fetch Protected Resource Metadata (RFC 9728):

   \`GET ${OAUTH_PROTECTED_RESOURCE_URL}\`

2. Fetch Authorization Server metadata (RFC 8414), including the \`agent_auth\` block:

   \`GET ${OAUTH_AUTHORIZATION_SERVER_URL}\`

3. Optional: OpenID Connect discovery at ${OPENID_CONFIGURATION_URL}

On \`401 Unauthorized\` from protected routes, read \`WWW-Authenticate: Bearer resource_metadata="…"\` when present.

## Step 2 — Pick a method

| Identity type | When to use | Credential |
| --- | --- | --- |
| \`anonymous\` | Public listing JSON only | None |
| \`identity_assertion\` + ID-JAG | Trusted agent provider vouches for a user | Bearer access token |
| \`identity_assertion\` + \`verified_email\` | User email only; claim ceremony required | Bearer access token after claim |

## Step 3 — Register {#registration}

**Public listing data (anonymous):** No registration is required. Call directly:

- \`GET ${SITE_URL}/api/public/listings\`
- \`GET ${SITE_URL}/api/public/listings/{slug}\`

OpenAPI: ${SITE_URL}/openapi.json

**Protected admin APIs:** Human operators sign in at ${SITE_URL}/admin/login (Supabase Auth, email). Programmatic agent registration for admin scopes is by partnership only — contact HomeUP at +65 8087 7015 or WhatsApp.

Metadata \`register_uri\`: ${AUTH_MD_URL}#registration

## Step 4 — Claim {#claim}

Public API usage requires no claim ceremony.

For protected APIs, present \`Authorization: Bearer <access_token>\` from an advertised authorization server. Tokens are validated against the JWKS URI in OAuth metadata.

For \`verified_email\` identity assertions, complete the claim ceremony at the metadata \`claim_uri\` before exchanging for a bearer token.

Metadata \`claim_uri\`: ${AUTH_MD_URL}#claim

## Step 5 — Use the credential

Send \`Authorization: Bearer <access_token>\` on requests to \`${SITE_URL}/api/admin/*\`.

Admin routes require a Supabase OAuth access token obtained through the authorization server above.

## Revocation {#revocation}

Revoke Supabase sessions through the authorization server \`revocation_endpoint\` in ${OAUTH_AUTHORIZATION_SERVER_URL}.

Supported revocation events: \`credential_revoked\`.

Metadata \`revocation_uri\`: ${AUTH_MD_URL}#revocation
`;
}
