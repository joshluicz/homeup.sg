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
import {
  countDraftListings,
  publishAllDraftListings,
} from "@/lib/listings/publish-all-drafts";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

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
    no_url: number;
    invalid_url: number;
    unknown_agent: number;
    duplicate_id: number;
  };
  by_agent?: Record<string, number>;
  sheet_total_rows?: number;
};

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${LISTINGS_SHEET_ID}/edit`;

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
  const [draftCount, setDraftCount] = useState(0);
  const [publishingAll, setPublishingAll] = useState(false);
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
    countDraftListings()
      .then(setDraftCount)
      .catch(() => setDraftCount(0));
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
      setStatusMessage(
        `Loaded ${json.saved ?? 0} active listing(s) from Google Sheet. Review changes below before syncing to HomeUP.`,
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
              ? "PropertyGuru blocked server fetch — run npm run pg:agent on this PC and sync again"
              : (json.error ?? "Import failed");
          failed.push({ pg_url: item.pg_url, error: err });
        }
      }

      setSyncResult({ success: true, added, failed, skipped, archived, purged });
      setStatusMessage(
        `Sync complete — ${added.length} new draft(s)${failed.length > 0 ? `, ${failed.length} failed` : ""}, ${archived.length} archived${purged > 0 ? `, ${purged} old archive(s) deleted` : ""}.`,
      );
      await refreshPreview();
      setDraftCount(await countDraftListings());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }

  async function handlePublishAllDrafts() {
    if (draftCount === 0) return;
    if (!window.confirm(`Publish all ${draftCount} draft listing(s)?`)) return;

    setPublishingAll(true);
    setError(null);
    try {
      const n = await publishAllDraftListings();
      setStatusMessage(`Published ${n} listing(s) to the live site.`);
      setDraftCount(await countDraftListings());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishingAll(false);
    }
  }

  const canSyncNow =
    preview && (preview.to_import.length > 0 || preview.to_archive.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Listings sync</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Google Sheet is the source of truth for active listings. Refresh → review → sync →
          publish.
        </p>
      </div>

      {!agentChecking && !agentOnline && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Imports need the local agent on this PC</p>
          <p className="mt-1 text-amber-800">
            PropertyGuru blocks Vercel from fetching listing pages. Before syncing new imports, run{" "}
            <code className="text-xs">npm run pg:agent</code> on this computer and keep it open.
          </p>
        </div>
      )}

      {agentOnline && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Local agent is running — imports will fetch PropertyGuru pages from this PC.
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">
          Step 1 — Refresh from Google Sheet
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Reads the team&apos;s listings tracker (PropertyGuru links, agent, status). Rows with{" "}
          <strong>Remarks</strong> exactly <strong>SOLD</strong> or <strong>DELISTED</strong> are
          skipped (e.g. &quot;DELISTED, RELIST LATER&quot; still counts as active). Remove sold
          listings from the sheet when they should leave the site.
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
        {sheetResult?.by_agent && (
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
        {sheetResult?.skipped && (
          <p className="mt-2 text-xs text-neutral-500">
            Skipped from sheet: {sheetResult.skipped.sold} sold, {sheetResult.skipped.delisted}{" "}
            delisted
            {(sheetResult.skipped.held_off_website ?? 0) > 0
              ? `, ${sheetResult.skipped.held_off_website} held off website (relist later)`
              : ""}
            {sheetResult.skipped.unknown_agent > 0
              ? `, ${sheetResult.skipped.unknown_agent} unknown agent`
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
            {preview.unchanged !== preview.on_site_active + preview.on_site_drafts && (
              <span className="block mt-1 text-xs text-neutral-500">
                PG ID in database ({preview.unchanged}) counts rows linked by PropertyGuru ID —
                not the same as live count until all are published.
              </span>
            )}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-green-50 px-4 py-3">
              <p className="text-2xl font-bold text-green-800">{preview.to_import.length}</p>
              <p className="text-sm text-green-700">New → import as drafts</p>
            </div>
            <div className="rounded-lg bg-primary-50 px-4 py-3">
              <p className="text-2xl font-bold text-primary-800">{preview.on_site_active}</p>
              <p className="text-sm text-primary-700">Live on public site</p>
            </div>
            <div className="rounded-lg bg-neutral-100 px-4 py-3">
              <p className="text-2xl font-bold text-neutral-800">{preview.unchanged}</p>
              <p className="text-sm text-neutral-600">PG ID in database</p>
              <p className="mt-1 text-xs text-neutral-500">
                {preview.on_site_drafts} draft
                {preview.on_site_drafts === 1 ? "" : "s"} waiting to publish
              </p>
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
          <h2 className="text-sm font-semibold text-neutral-900">Step 3 — Approve &amp; publish</h2>
          <div className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
            <p>
              <strong>Imported:</strong> {syncResult.added?.length ?? 0} draft(s)
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
          <div className="mt-4 flex flex-wrap gap-3">
            {draftCount > 0 && (
              <Button type="button" disabled={publishingAll} onClick={handlePublishAllDrafts}>
                {publishingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Publish all drafts ({draftCount})
              </Button>
            )}
            <Link
              href="/admin/listings?filter=draft"
              className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Review drafts →
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
