import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENTS } from "@/lib/data/agents";

export type PgSyncPreview = {
  to_import: Array<{
    pg_url: string;
    pg_listing_id: string;
    agent_slug: string;
    agent_name: string;
  }>;
  to_archive: Array<{
    title: string;
    slug: string;
    source_pg_url: string | null;
  }>;
  /** Sheet sources with matching source_pg_listing_id in DB. */
  unchanged: number;
  source_count: number;
  /** Published on the public site (status = active). */
  on_site_active: number;
  /** Imported but not yet published (status = draft). */
  on_site_drafts: number;
};

export async function getPgSyncPreview(
  supabase: SupabaseClient,
): Promise<PgSyncPreview> {
  const { data: sources, error: sourcesError } = await supabase
    .from("pg_listing_sources")
    .select("agent_slug, pg_url, pg_listing_id");

  if (sourcesError) throw new Error(sourcesError.message);

  const sourceRows = sources ?? [];
  const sourceIds = new Set(sourceRows.map((row) => row.pg_listing_id as string));

  const agentNameBySlug = new Map(AGENTS.map((a) => [a.slug, a.name]));

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("title, slug, source_pg_listing_id, source_pg_url, status")
    .is("deleted_at", null);

  if (listingsError) throw new Error(listingsError.message);

  const homeupPgIds = new Set(
    (listings ?? [])
      .map((row) => row.source_pg_listing_id as string | null)
      .filter((pgId): pgId is string => Boolean(pgId)),
  );

  const on_site_active = (listings ?? []).filter((row) => row.status === "active").length;
  const on_site_drafts = (listings ?? []).filter((row) => row.status === "draft").length;

  const to_import = sourceRows
    .filter((row) => !homeupPgIds.has(row.pg_listing_id as string))
    .map((row) => ({
      pg_url: row.pg_url as string,
      pg_listing_id: row.pg_listing_id as string,
      agent_slug: row.agent_slug as string,
      agent_name: agentNameBySlug.get(row.agent_slug as string) ?? row.agent_slug,
    }));

  const to_archive = (listings ?? [])
    .filter((row) => {
      const pgId = row.source_pg_listing_id as string | null;
      return pgId && !sourceIds.has(pgId);
    })
    .map((row) => ({
      title: row.title as string,
      slug: row.slug as string,
      source_pg_url: row.source_pg_url as string | null,
    }));

  const unchanged = sourceRows.filter((row) =>
    homeupPgIds.has(row.pg_listing_id as string),
  ).length;

  return {
    to_import,
    to_archive,
    unchanged,
    source_count: sourceRows.length,
    on_site_active,
    on_site_drafts,
  };
}
