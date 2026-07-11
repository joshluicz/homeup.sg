"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  loadPgSyncPreview,
  type PgSyncPreview,
} from "@/lib/listings/pg-sync-preview-client";
import { LISTINGS_SHEET_ID } from "@/lib/listings/google-sheet-constants";
import {
  fetchPgListingHtmlViaAgent,
  probePgFetchAgent,
} from "@/lib/listings/pg-fetch-agent-client";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { triggerListingRevalidate } from "@/lib/listings/revalidate-listings-client";
import { CheckCircle2, Download, ExternalLink, Loader2 } from "lucide-react";

type SyncResponse = {
  success: boolean;
  error?: string;
  added?: Array<{ title: string; slug: string; pg_url: string }>;
  skipped?: number;
  archived?: Array<{ title: string; slug: string }>;
  purged?: number;
  failed?: Array<{ pg_url: string; error: string }>;
};

type SheetRefreshResponse = {
  success: boolean;
  error?: string;
  saved?: number;
  skipped?: {
    sold: number;
    delisted: number;
    held_off_website: number;
    missing_agent_column?: number;
    agent_in_wrong_column?: number;
    no_url: number;
    invalid_url: number;
    unknown_agent: number;
    duplicate_id: number;
    not_listed?: number;
  };
  sheet_agent_column_count?: number;
  sheet_format_fixes?: Array<{
    pg_listing_id: string;
    client_name: string;
    misplaced_agent_label: string;
    remarks: string;
  }>;
  by_agent?: Record<string, number>;
  sheet_total_rows?: number;
  sell_on_sheet?: number;
  rent_on_sheet?: number;
  price_updates?: Array<{
    pg_listing_id: string;
    slug: string;
    old_price: number;
    new_price: number;
  }>;
  linked_manual?: Array<{
    pg_listing_id: string;
    slug: string;
  }>;
};

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${LISTINGS_SHEET_ID}/edit`;
const SYNC_KIT_ZIP = "/downloads/homeup-listings-sync-kit.zip";

export function PgSourcesPanel() {
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetResult, setSheetResult] = useState<SheetRefreshResponse | null>(null);
  const [preview, setPreview] = useState<PgSyncPreview | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [agentOnline, setAgentOnline] = useState(false);
  const [agentChecking, setAgentChecking] = useState(true);

  const refreshPreview = useCallback(async () => {
    try {
      const supabase = createClient();
      setPreview(await loadPgSyncPreview(supabase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    }
  }, []);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);

  useEffect(() => {
    let cancelled = false;
    async function checkAgent() {
      setAgentChecking(true);
      const online = await probePgFetchAgent();
      if (!cancelled) {
        setAgentOnline(online);
        setAgentChecking(false);
      }
    }
    void checkAgent();
    const interval = setInterval(() => void checkAgent(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleRefreshFromSheet() {
    setRefreshing(true);
    setError(null);
    setStatusMessage(null);
    setSheetResult(null);
    setSyncResult(null);

    try {
      const res = await fetch("/api/listings/pg-sources/sync-sheet", { method: "POST" });
      const json = (await res.json()) as SheetRefreshResponse;
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Sheet refresh failed");
      }

      setSheetResult(json);
      const sell = json.sell_on_sheet ?? json.saved ?? 0;
      const rent = json.rent_on_sheet ?? 0;
      setStatusMessage(
        `Loaded ${json.saved ?? 0} listed source(s) for sync (${sell} sale + ${rent} rent). Linked ${json.linked_manual?.length ?? 0} manual listing(s). Updated ${json.price_updates?.length ?? 0} price(s).`,
      );
      await refreshPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sheet refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSync() {
    if (!preview) return;

    const queue = preview.to_import;
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    setSyncProgress(queue.length > 0 ? { current: 0, total: queue.length } : null);

    const added: NonNullable<SyncResponse["added"]> = [];
    const failed: NonNullable<SyncResponse["failed"]> = [];
    let skipped = preview.unchanged;
    let archived: NonNullable<SyncResponse["archived"]> = [];
    let purged = 0;

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const archiveRes = await fetch("/api/listings/sync-pg/archive", { method: "POST" });
      const archiveJson = (await archiveRes.json()) as {
        success?: boolean;
        archived?: SyncResponse["archived"];
        purged?: number;
        error?: string;
      };
      if (!archiveRes.ok || !archiveJson.success) {
        throw new Error(archiveJson.error ?? "Archive step failed");
      }
      archived = archiveJson.archived ?? [];
      purged = archiveJson.purged ?? 0;

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        setSyncProgress({ current: i + 1, total: queue.length });

        let html: string | undefined;
        if (agentOnline && accessToken) {
          try {
            html = await fetchPgListingHtmlViaAgent(item.pg_url, accessToken);
          } catch {
            // Fall back to server-side PG fetch
          }
        }

        const res = await fetch("/api/listings/sync-pg/import-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pg_url: item.pg_url,
            pg_listing_id: item.pg_listing_id,
            html,
          }),
        });

        let json = (await res.json()) as {
          success?: boolean;
          skipped?: boolean;
          error?: string;
          title?: string;
          slug?: string;
        };

        if (
          !json.success &&
          json.error === "FETCH_BLOCKED" &&
          agentOnline &&
          accessToken &&
          !html
        ) {
          try {
            html = await fetchPgListingHtmlViaAgent(item.pg_url, accessToken);
            const retryRes = await fetch("/api/listings/sync-pg/import-one", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pg_url: item.pg_url,
                pg_listing_id: item.pg_listing_id,
                html,
              }),
            });
            json = (await retryRes.json()) as typeof json;
          } catch {
            // keep original error
          }
        }

        if (json.success && json.title && json.slug) {
          added.push({ title: json.title, slug: json.slug, pg_url: item.pg_url });
        } else if (json.skipped) {
          skipped += 1;
        } else {
          const err =
            json.error === "FETCH_BLOCKED"
              ? "PropertyGuru blocked server fetch — run start-agent from the sync kit on this PC and sync again"
              : (json.error ?? "Import failed");
          failed.push({ pg_url: item.pg_url, error: err });
        }
      }

      setSyncResult({ success: true, added, failed, skipped, archived, purged });
      if (added.length > 0 || archived.length > 0) {
        await triggerListingRevalidate([
          ...added.map((item) => item.slug),
          ...archived.map((item) => item.slug),
        ]);
      }
      setStatusMessage(
        `Sync complete — ${added.length} imported and published${failed.length > 0 ? `, ${failed.length} failed` : ""}, ${archived.length} archived${purged > 0 ? `, ${purged} old archive(s) deleted` : ""}.`,
      );
      await refreshPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }

  const canSyncNow =
    preview && (preview.to_import.length > 0 || preview.to_archive.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Listings sync</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Google Sheet is the source of truth for active listings and prices. Refresh → review →
          sync. New imports are published to the live site immediately.
        </p>
      </div>

      <section className="rounded-xl border border-primary-200 bg-primary-50 p-5">
        <h2 className="text-sm font-semibold text-primary-950">Local sync kit (Batam / remote admin)</h2>
        <p className="mt-1 text-sm text-primary-900">
          PropertyGuru blocks cloud servers. Download the sync kit, open <code className="text-xs">index.html</code> in
          the unzipped folder, then run the local agent or a full automated sync.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/sync-kit-handoff"
            className="inline-flex items-center rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Step-by-step guide
          </Link>
          <a
            href={SYNC_KIT_ZIP}
            download="homeup-listings-sync-kit.zip"
            className="inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-white px-5 py-2.5 text-sm font-semibold text-primary-900 hover:bg-primary-100/50"
          >
            <Download className="h-4 w-4" />
            Download sync kit
          </a>
        </div>
      </section>

      {!agentChecking && !agentOnline && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Imports need the local agent on this PC</p>
          <p className="mt-1 text-amber-800">
            PropertyGuru blocks Vercel from fetching listing pages. Unzip the kit, open{" "}
            <code className="text-xs">index.html</code>, then run <code className="text-xs">start-agent</code> or{" "}
            <code className="text-xs">npm run pg:agent</code> and keep that window open before syncing.
          </p>
        </div>
      )}

      {agentOnline && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Local agent is running — imports will fetch PropertyGuru pages from this PC and publish
          immediately.
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">
          Step 1 — Refresh from Google Sheet
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Reads the team&apos;s listings tracker. A row is active only when{" "}
          <strong>Status</strong> is <strong>Listed</strong>. Rows marked{" "}
          <strong>Sold</strong> or <strong>Delisted</strong> are skipped. Each listed row must have
          the agent in <strong>Agent column B</strong> and a valid PropertyGuru link.{" "}
          <strong>Listed Price</strong> is pushed into any matching HomeUP listing.
        </p>
        <a
          href={SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
        >
          Open listings sheet
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <div className="mt-4">
          <Button type="button" onClick={handleRefreshFromSheet} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh from Google Sheet
          </Button>
        </div>
        {sheetResult && (
          <>
            <p className="mt-3 text-sm text-neutral-700">
              <strong>{sheetResult.saved ?? 0}</strong> active for HomeUP sync
              {(sheetResult.sell_on_sheet != null || sheetResult.rent_on_sheet != null) && (
                <> — {sheetResult.sell_on_sheet ?? 0} sale + {sheetResult.rent_on_sheet ?? 0} rent</>
              )}
              {sheetResult.sheet_total_rows != null && (
                <>
                  {" "}
                  · {sheetResult.sheet_total_rows} PG rows on sheet ({sheetResult.skipped?.sold ?? 0}{" "}
                  sold, {sheetResult.skipped?.delisted ?? 0} delisted excluded)
                </>
              )}
            </p>
            {(sheetResult.sheet_format_fixes?.length ?? 0) > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <p className="font-medium">
                  {sheetResult.sheet_format_fixes!.length} row(s): move agent name into column B
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  {sheetResult.sheet_format_fixes!.map((fix) => (
                    <li key={fix.pg_listing_id}>
                      <strong>{fix.pg_listing_id}</strong> — put &quot;{fix.misplaced_agent_label}
                      &quot; in Agent B · {fix.client_name.slice(0, 50)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sheetResult.by_agent && (
              <ul className="mt-4 space-y-1 text-sm text-neutral-700">
                {Object.entries(sheetResult.by_agent)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([name, count]) => (
                    <li key={name}>
                      <strong>{name}:</strong> {count} active
                    </li>
                  ))}
              </ul>
            )}
            {(sheetResult.price_updates?.length ?? 0) > 0 && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950">
                <p className="font-medium">
                  Updated {sheetResult.price_updates!.length} listing price(s) from Listed Price
                </p>
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
                  {sheetResult.price_updates!.map((update) => (
                    <li key={update.pg_listing_id}>
                      <strong>{update.pg_listing_id}</strong> — ${update.old_price.toLocaleString(
                        "en-SG",
                      )}{" "}
                      → ${update.new_price.toLocaleString("en-SG")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(sheetResult.linked_manual?.length ?? 0) > 0 && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
                <p className="font-medium">
                  Linked {sheetResult.linked_manual!.length} existing manual listing(s) to PG IDs
                </p>
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
                  {sheetResult.linked_manual!.map((linked) => (
                    <li key={linked.pg_listing_id}>
                      <strong>{linked.pg_listing_id}</strong> — {linked.slug}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        {sheetResult?.skipped && (
          <p className="mt-2 text-xs text-neutral-500">
            Skipped from sheet: {sheetResult.skipped.sold} sold, {sheetResult.skipped.delisted}{" "}
            delisted
            {(sheetResult.skipped.held_off_website ?? 0) > 0
              ? `, ${sheetResult.skipped.held_off_website} held off website (relist later)`
              : ""}
            {(sheetResult.skipped.agent_in_wrong_column ?? 0) > 0
              ? `, ${sheetResult.skipped.agent_in_wrong_column} agent in wrong column (move to Agent B)`
              : ""}
            {(sheetResult.skipped.missing_agent_column ?? 0) > 0
              ? `, ${sheetResult.skipped.missing_agent_column} missing Agent column`
              : ""}
            {sheetResult.skipped.unknown_agent > 0
              ? `, ${sheetResult.skipped.unknown_agent} unknown agent`
              : ""}
            {(sheetResult.skipped.not_listed ?? 0) > 0
              ? `, ${sheetResult.skipped.not_listed} not Listed status`
              : ""}
          </p>
        )}
        {preview && (
          <p className="mt-2 text-sm text-neutral-600">
            <strong>{preview.source_count}</strong> active source(s) loaded
            {preview.source_count === 0 ? " — click Refresh above" : ""}.
          </p>
        )}
      </section>

      {preview && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-neutral-900">
            Step 2 — Review changes (before sync)
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Sheet has <strong>{preview.source_count}</strong> listings for HomeUP.{" "}
            <strong>{preview.on_site_active}</strong> are live;{" "}
            <strong>{preview.to_import.length}</strong> still need importing.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-green-50 px-4 py-3">
              <p className="text-2xl font-bold text-green-800">{preview.to_import.length}</p>
              <p className="text-sm text-green-700">New → import and publish</p>
            </div>
            <div className="rounded-lg bg-primary-50 px-4 py-3">
              <p className="text-2xl font-bold text-primary-800">{preview.on_site_active}</p>
              <p className="text-sm text-primary-700">Live on public site</p>
            </div>
            <div className="rounded-lg bg-neutral-100 px-4 py-3">
              <p className="text-2xl font-bold text-neutral-800">{preview.unchanged}</p>
              <p className="text-sm text-neutral-600">PG ID in database</p>
            </div>
            <div className="rounded-lg bg-amber-50 px-4 py-3">
              <p className="text-2xl font-bold text-amber-800">{preview.to_archive.length}</p>
              <p className="text-sm text-amber-700">Not on sheet → archive</p>
            </div>
          </div>

          {preview.to_import.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-800">Will import:</p>
              <ul className="mt-1 max-h-40 overflow-y-auto text-sm text-neutral-600">
                {preview.to_import.map((item) => (
                  <li key={item.pg_listing_id} className="truncate font-mono text-xs">
                    {item.agent_name}: {item.pg_url}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.to_archive.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-800">Will archive:</p>
              <ul className="mt-1 max-h-40 overflow-y-auto text-sm text-neutral-600">
                {preview.to_archive.map((item) => (
                  <li key={item.slug}>
                    {item.title} ({item.slug})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <Button
              type="button"
              onClick={handleSync}
              disabled={syncing || !canSyncNow}
            >
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sync to HomeUP
            </Button>
          </div>
          {syncing && syncProgress && (
            <p className="mt-3 text-sm text-neutral-600">
              Importing {syncProgress.current} of {syncProgress.total}…
            </p>
          )}
        </section>
      )}

      {syncResult && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Step 3 — Sync results</h2>
          <div className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
            <p>
              <strong>Imported and published:</strong> {syncResult.added?.length ?? 0}
            </p>
            <p>
              <strong>Archived:</strong> {syncResult.archived?.length ?? 0}
            </p>
            {(syncResult.purged ?? 0) > 0 && (
              <p>
                <strong>Deleted (archived 7+ days):</strong> {syncResult.purged}
              </p>
            )}
            <p>
              <strong>Failed:</strong> {syncResult.failed?.length ?? 0}
            </p>
          </div>
          {(syncResult.failed?.length ?? 0) > 0 && (
            <ul className="mt-3 max-h-32 overflow-y-auto text-xs text-red-700">
              {syncResult.failed?.map((item) => (
                <li key={item.pg_url} className="mt-1 truncate">
                  {item.error} — {item.pg_url}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link
              href="/admin/listings"
              className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              View listings →
            </Link>
          </div>
        </section>
      )}

      {statusMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
