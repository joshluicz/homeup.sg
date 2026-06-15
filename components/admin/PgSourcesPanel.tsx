"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AGENTS } from "@/lib/data/agents";
import {
  loadPgAgentProfiles,
  savePgAgentProfiles,
} from "@/lib/listings/pg-agent-profiles-client";
import {
  loadPgSyncPreview,
  type PgSyncPreview,
} from "@/lib/listings/pg-sync-preview-client";
import type { FetchAgentPgResult } from "@/lib/listings/fetch-agent-pg-sources";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  countDraftListings,
  publishAllDraftListings,
} from "@/lib/listings/publish-all-drafts";
import { CheckCircle2, Loader2 } from "lucide-react";

type SyncResponse = {
  success: boolean;
  error?: string;
  added?: Array<{ title: string; slug: string; pg_url: string }>;
  skipped?: number;
  archived?: Array<{ title: string; slug: string }>;
  failed?: Array<{ pg_url: string; error: string }>;
};

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function PgSourcesPanel() {
  const [profileDrafts, setProfileDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingProfiles, setSavingProfiles] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchResults, setFetchResults] = useState<FetchAgentPgResult[] | null>(null);
  const [preview, setPreview] = useState<PgSyncPreview | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [draftCount, setDraftCount] = useState(0);
  const [publishingAll, setPublishingAll] = useState(false);

  const canRunLocalActions = isLocalDevHost();
  const enabledCount = AGENTS.filter((a) => profileDrafts[a.slug]?.trim()).length;

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const saved = await loadPgAgentProfiles();
      const drafts: Record<string, string> = {};
      for (const agent of AGENTS) {
        drafts[agent.slug] = saved[agent.slug] ?? "";
      }
      setProfileDrafts(drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPreview = useCallback(async () => {
    try {
      const supabase = createClient();
      setPreview(await loadPgSyncPreview(supabase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    countDraftListings()
      .then(setDraftCount)
      .catch(() => setDraftCount(0));
  }, [loadProfiles]);

  async function handleSaveProfiles() {
    setSavingProfiles(true);
    setError(null);
    setStatusMessage(null);
    try {
      const { saved, errors } = await savePgAgentProfiles(profileDrafts);
      if (errors.length > 0) {
        setError(errors.join(" "));
        return;
      }
      setStatusMessage(
        `Saved PropertyGuru profiles for ${saved} agent(s). ${AGENTS.length - saved} agent(s) will be skipped on fetch.`,
      );
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profiles");
    } finally {
      setSavingProfiles(false);
    }
  }

  async function handleFetchAll() {
    setFetching(true);
    setError(null);
    setStatusMessage(null);
    setFetchResults(null);
    setPreview(null);
    setSyncResult(null);

    try {
      const res = await fetch("/api/listings/pg-sources/fetch-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fetch_all: true }),
      });
      const text = await res.text();
      let json: {
        success?: boolean;
        results?: FetchAgentPgResult[];
        skipped_agents?: Array<{ agent_slug: string; agent_name: string }>;
        error?: string;
      };
      try {
        json = JSON.parse(text) as typeof json;
      } catch {
        throw new Error("Fetch API unavailable. Run npm run dev on localhost.");
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Fetch failed");
      }

      setFetchResults(json.results ?? []);
      const active = (json.results ?? []).filter((r) => !r.skipped && !r.error);
      const totalFetched = active.reduce((n, r) => n + r.fetched, 0);

      setStatusMessage(
        `Fetched ${totalFetched} active listing(s) from ${active.length} agent(s). Review changes below before syncing.`,
      );
      await refreshPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setFetching(false);
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

    try {
      const archiveRes = await fetch("/api/listings/sync-pg/archive", { method: "POST" });
      const archiveJson = (await archiveRes.json()) as {
        success?: boolean;
        archived?: SyncResponse["archived"];
        error?: string;
      };
      if (!archiveRes.ok || !archiveJson.success) {
        throw new Error(archiveJson.error ?? "Archive step failed");
      }
      archived = archiveJson.archived ?? [];

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        setSyncProgress({ current: i + 1, total: queue.length });

        const res = await fetch("/api/listings/sync-pg/import-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pg_url: item.pg_url,
            pg_listing_id: item.pg_listing_id,
          }),
        });

        const json = (await res.json()) as {
          success?: boolean;
          skipped?: boolean;
          error?: string;
          title?: string;
          slug?: string;
        };

        if (json.success && json.title && json.slug) {
          added.push({ title: json.title, slug: json.slug, pg_url: item.pg_url });
        } else if (json.skipped) {
          skipped += 1;
        } else {
          failed.push({ pg_url: item.pg_url, error: json.error ?? "Import failed" });
        }
      }

      const result: SyncResponse = {
        success: true,
        added,
        failed,
        skipped,
        archived,
      };
      setSyncResult(result);
      setStatusMessage(
        `Sync complete — ${added.length} new draft(s)${failed.length > 0 ? `, ${failed.length} failed (retry sync to retry failures)` : ""}.`,
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

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">PropertyGuru sync</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Set up agents → fetch all active listings → review changes → sync → publish drafts.
        </p>
      </div>

      {!canRunLocalActions && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Steps 2–3 need localhost</p>
          <p className="mt-1 text-amber-800">
            You can save agent profile URLs here on the live site. Run{" "}
            <code className="text-xs">npm run dev</code> for fetch and sync.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-neutral-900">
              Step 1 — Agent PropertyGuru profiles
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Paste each agent&apos;s profile URL. <strong>Empty = skipped</strong> on fetch. Only
              Dennis and Tong Boon need URLs if they&apos;re the only ones on PG.
            </p>

            <div className="mt-4 space-y-4">
              {AGENTS.map((agent) => (
                <div key={agent.slug}>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    {agent.name}
                    <span className="ml-2 font-normal text-neutral-400">({agent.cea})</span>
                  </label>
                  <input
                    type="url"
                    className={inputClass}
                    value={profileDrafts[agent.slug] ?? ""}
                    onChange={(e) =>
                      setProfileDrafts((prev) => ({
                        ...prev,
                        [agent.slug]: e.target.value,
                      }))
                    }
                    placeholder="https://www.propertyguru.com.sg/agent/dennis-lim-356119 (leave empty to skip)"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button type="button" onClick={handleSaveProfiles} disabled={savingProfiles}>
                {savingProfiles ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save agent profiles
              </Button>
              <p className="mt-2 text-xs text-neutral-500">
                {enabledCount} agent(s) will be included in fetch.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-neutral-900">
              Step 2 — Fetch all enabled agents
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Pulls active sale + rent listings via CEA for every agent with a profile URL saved.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                onClick={handleFetchAll}
                disabled={fetching || !canRunLocalActions || enabledCount === 0}
              >
                {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Fetch all agents
              </Button>
            </div>
            {fetchResults && (
              <ul className="mt-4 space-y-1 text-sm text-neutral-700">
                {fetchResults.map((r) => (
                  <li key={r.agent_slug}>
                    <strong>{r.agent_name}:</strong>{" "}
                    {r.skipped ? (
                      <span className="text-neutral-500">{r.skip_reason}</span>
                    ) : r.error ? (
                      <span className="text-red-700">{r.error}</span>
                    ) : (
                      `${r.fetched} found, ${r.saved} saved`
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {preview && (
            <section className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-neutral-900">
                Step 3 — Review changes (before sync)
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                This is what sync will do. No listings change until you click sync.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-green-50 px-4 py-3">
                  <p className="text-2xl font-bold text-green-800">{preview.to_import.length}</p>
                  <p className="text-sm text-green-700">New → import as drafts</p>
                </div>
                <div className="rounded-lg bg-neutral-100 px-4 py-3">
                  <p className="text-2xl font-bold text-neutral-800">{preview.unchanged}</p>
                  <p className="text-sm text-neutral-600">Already on HomeUP</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-4 py-3">
                  <p className="text-2xl font-bold text-amber-800">{preview.to_archive.length}</p>
                  <p className="text-sm text-amber-700">Removed from PG → archive</p>
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
                  <p className="mt-1 text-xs text-neutral-500">
                    ~{preview.to_import.length * 4000} tokens estimated (Claude, new only).
                  </p>
                </div>
              )}

              {preview.to_archive.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-neutral-800">Will archive:</p>
                  <ul className="mt-1 text-sm text-neutral-600">
                    {preview.to_archive.map((item) => (
                      <li key={item.slug}>
                        {item.title} ({item.slug})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.skipped_agents.length > 0 && (
                <p className="mt-4 text-xs text-neutral-500">
                  Skipped (no profile URL):{" "}
                  {preview.skipped_agents.map((a) => a.agent_name).join(", ")}
                </p>
              )}

              <div className="mt-6">
                <Button
                  type="button"
                  onClick={handleSync}
                  disabled={
                    syncing ||
                    !canRunLocalActions ||
                    (preview.to_import.length === 0 && preview.to_archive.length === 0)
                  }
                >
                  {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sync to HomeUP
                </Button>
              </div>
              {syncing && syncProgress && (
                <p className="mt-3 text-sm text-neutral-600">
                  Importing {syncProgress.current} of {syncProgress.total}… (one at a time to avoid
                  timeouts)
                </p>
              )}
            </section>
          )}

          {syncResult && (
            <section className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-neutral-900">
                Step 4 — Approve &amp; publish
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Sync created drafts. Open each listing, check details, then Publish.
              </p>
              <div className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
                <p>
                  <strong>Imported:</strong> {syncResult.added?.length ?? 0} draft(s)
                </p>
                <p>
                  <strong>Archived:</strong> {syncResult.archived?.length ?? 0}
                </p>
                <p>
                  <strong>Failed:</strong> {syncResult.failed?.length ?? 0}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {draftCount > 0 && (
                  <Button
                    type="button"
                    disabled={publishingAll}
                    onClick={handlePublishAllDrafts}
                  >
                    {publishingAll ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
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
        </>
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
