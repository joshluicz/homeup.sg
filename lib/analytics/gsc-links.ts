/** Client-safe GSC deep links — no server imports. */

export function gscInspectUrl(url: string, siteUrl = "sc-domain:homeup.sg"): string {
  const resourceId = encodeURIComponent(siteUrl);
  return `https://search.google.com/search-console/inspect?resource_id=${resourceId}&id=${encodeURIComponent(url)}`;
}
