import { SITE_URL } from "@/lib/seo/constants";

export const OAUTH_PROTECTED_RESOURCE_PATH = "/.well-known/oauth-protected-resource";
export const OAUTH_PROTECTED_RESOURCE_URL = `${SITE_URL}${OAUTH_PROTECTED_RESOURCE_PATH}`;

/** RFC 9728 OAuth Protected Resource Metadata. */
export function buildOAuthProtectedResourceMetadata() {
  return {
    resource: SITE_URL,
    authorization_servers: [SITE_URL],
    scopes_supported: ["openid", "email", "profile"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${SITE_URL}/llms.txt`,
  };
}
