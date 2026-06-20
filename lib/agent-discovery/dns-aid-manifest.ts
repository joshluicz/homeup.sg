import { NextResponse } from "next/server";
import {
  AGENT_INDEX,
  AGENT_INDEX_PATH,
  DNS_AID_HTTPS_RECORDS,
  DNS_AID_INDEX_TXT,
  DNS_AID_TARGET,
} from "@/lib/agent-discovery/dns-aid";
import { SITE_URL } from "@/lib/seo/constants";

/** Operator manifest for DNS-AID records and DNSSEC requirements. */
export function buildDnsAidManifest() {
  return {
    version: "1.0",
    domain: DNS_AID_TARGET,
    site: SITE_URL,
    agent_index: `${SITE_URL}${AGENT_INDEX_PATH}`,
    dnssec: {
      required: true,
      status: "Enable DNSSEC in your DNS provider (Cloudflare: DNS → Settings → DNSSEC → Enable)",
      validation_note:
        "Agent scanners require DNSSEC-validated responses from public resolvers. Unsigned zones fail validation even when SVCB/HTTPS records exist.",
      cloudflare_steps: [
        "Open Cloudflare Dashboard → select homeup.sg zone",
        "DNS → Settings → DNSSEC → Enable",
        "Add DS records at your registrar if the domain is not on Cloudflare nameservers",
        "Wait for propagation (up to 24 hours)",
      ],
    },
    records: {
      https: DNS_AID_HTTPS_RECORDS,
      txt: DNS_AID_INDEX_TXT,
    },
    agents: AGENT_INDEX.agents,
  };
}
