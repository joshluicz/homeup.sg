"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AGENTS } from "@/lib/data/agents";
import {
  loadPgSources,
  savePgSourcesForAgent,
  type PgListingSource,
} from "@/lib/listings/pg-sources-client";
import type { InvalidPgLine } from "@/lib/listings/pg-url";
import type { FetchAgentPgResult } from "@/lib/listings/fetch-agent-pg-sources";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
  const [sources, setSources] = useState<PgListingSource[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]?.slug ?? "");
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchResults, setFetchResults] = useState<FetchAgentPgResult[] | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [invalidLines, setInvalidLines] = useState<InvalidPgLine[]>([]);
  const [showManual, setShowManual] = useState(false);

  const canRunLocalActions = isLocalDevHost();

  const sourcesByAgent = useMemo(() => {
    const map = new Map<string, PgListingSource[]>();
    for (const source of sources) {
      const list = map.get(source.agent_slug) ?? [];
      list.push(source);
      map.set(source.agent_slug, list);
    }
    return map;
  }, [sources]);

  const totalSources = sources.length;

  const loadSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSources(await loadPgSources());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  useEffect(() => {
    if (!activeAgent) return;
    const existing = sourcesByAgent.get(activeAgent) ?? [];
    if (drafts[activeAgent] !== undefined) return;
    setDrafts((prev) => ({
      ...prev,
      [activeAgent]: existing.map((s) => s.pg_url).join("\n"),
    }));
  }, [activeAgent, sourcesByAgent, drafts]);

  async function handleFetch(agentSlug?: string) {
    setFetching(true);
    setError(null);
    setStatusMessage(null);
    setFetchResults(null);

    try {
      const res = await fetch("/api/listings/pg-sources/fetch-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          agentSlug ? { agent_slug: agentSlug } : { fetch_all: true },
        ),
      });
      const text = await res.text();
      let json: { success?: boolean; results?: FetchAgentPgResult[]; error?: string };
      try {
        json = JSON.parse(text) as typeof json;
      } catch {
        throw new Error("Fetch API unavailable. Run npm run dev on localhost.");
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Fetch failed");
      }

      const results = json.results ?? [];
      setFetchResults(results);

      const totalFetched = results.reduce((n, r) => n + r.fetched, 0);
      const totalSaved = results.reduce((n, r) => n + r.saved, 0);
      const blocked = results.filter((r) => r.error?.includes("blocked"));

      if (blocked.length > 0 && totalFetched === 0) {
        setError("PropertyGuru blocked the fetch. Try again on localhost or paste links manually.");
      } else {
        setStatusMessage(
          `Found ${totalFetched} active listing(s) on PropertyGuru. Saved ${totalSaved} link(s).`,
        );
      }

      setDrafts({});
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setFetching(false);
    }
  }

  async function handleManualSave() {
    if (!activeAgent) return;
    setSaving(true);
    setError(null);
    setStatusMessage(null);
    setInvalidLines([]);

    const agentName = AGENTS.find((a) => a.slug === activeAgent)?.name ?? activeAgent;

    try {
      const { saved, invalid } = await savePgSourcesForAgent(
        activeAgent,
        drafts[activeAgent] ?? "",
      );

      setInvalidLines(invalid);

      if (saved === 0 && invalid.length === 0) {
        setStatusMessage(`Cleared all saved links for ${agentName}.`);
      } else if (saved === 0 && invalid.length > 0) {
        setStatusMessage(`Nothing saved — check the invalid lines below.`);
      } else {
        setStatusMessage(`Manually saved ${saved} link(s) for ${agentName}.`);
      }

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[activeAgent];
        return next;
      });
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setStatusMessage(null);
    setSyncResult(null);

    try {
      const res = await fetch("/api/listings/sync-pg", { method: "POST" });
      const text = await res.text();
      let json: SyncResponse;
      try {
        json = JSON.parse(text) as SyncResponse;
      } catch {
        throw new Error("Sync API unavailable. Run npm run dev on localhost.");
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Sync failed");
      }
      setSyncResult(json);
      setStatusMessage(
        `Sync done — ${json.added?.length ?? 0} new draft(s), ${json.archived?.length ?? 0} archived.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

  const activeAgentName = AGENTS.find((a) => a.slug === activeAgent)?.name ?? activeAgent;
  const activeAgentCea = AGENTS.find((a) => a.slug === activeAgent)?.cea ?? "";
  const agentSourceCount = sourcesByAgent.get(activeAgent)?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">PropertyGuru sync</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Pull each agent&apos;s <strong>active listings</strong> from PropertyGuru, then import
          them to HomeUP as drafts.
        </p>
      </div>

      {!canRunLocalActions && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Run this on your laptop</p>
          <p className="mt-1 text-amber-800">
            Fetch and sync only work on localhost. Run{" "}
            <code className="text-xs">npm run dev</code>, then open{" "}
            <code className="text-xs">http://localhost:3000/admin/listings/pg-sources</code>
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
            <h2 className="text-sm font-semibold text-neutral-900">Step 1 — Fetch from PropertyGuru</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Uses each agent&apos;s CEA number to find their active sale and rent listings. No
              need to paste individual links.
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {totalSources} listing link(s) saved across all agents.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {AGENTS.map((agent) => (
                <button
                  key={agent.slug}
                  type="button"
                  onClick={() => setActiveAgent(agent.slug)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    activeAgent === agent.slug
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                  )}
                >
                  {agent.name}
                  {(sourcesByAgent.get(agent.slug)?.length ?? 0) > 0 && (
                    <span className="ml-1.5 opacity-80">
                      ({sourcesByAgent.get(agent.slug)?.length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm text-neutral-600">
              Selected: <strong>{activeAgentName}</strong> ({activeAgentCea}) — {agentSourceCount}{" "}
              saved link(s)
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => handleFetch(activeAgent)}
                disabled={fetching || !canRunLocalActions}
              >
                {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Fetch {activeAgentName}&apos;s listings
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFetch()}
                disabled={fetching || !canRunLocalActions}
              >
                Fetch all agents
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-neutral-900">Step 2 — Import to HomeUP</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Imports new listings as <strong>drafts</strong>. Skips ones already imported.
              Archives listings removed from PropertyGuru.
            </p>

            <div className="mt-4">
              <Button
                type="button"
                onClick={handleSync}
                disabled={syncing || !canRunLocalActions || totalSources === 0}
              >
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sync to HomeUP
              </Button>
            </div>

            {syncing && (
              <p className="mt-3 text-sm text-neutral-600">
                Importing… only new listings use Claude (tokens).
              </p>
            )}
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="text-sm font-semibold text-neutral-900 hover:text-primary-700"
            >
              {showManual ? "▼" : "▶"} Manual link override (optional)
            </button>
            {showManual && (
              <div className="mt-4">
                <p className="mb-3 text-sm text-neutral-600">
                  Only use this if auto-fetch missed a listing. Paste full listing URLs (with{" "}
                  <code className="text-xs">/listing/</code> in the path).
                </p>
                <textarea
                  className={cn(inputClass, "min-h-[160px] font-mono text-xs")}
                  value={drafts[activeAgent] ?? ""}
                  onChange={(e) => {
                    setStatusMessage(null);
                    setDrafts((prev) => ({ ...prev, [activeAgent]: e.target.value }));
                  }}
                  placeholder="https://www.propertyguru.com.sg/listing/for-sale-example-500167641"
                />
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleManualSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save manual links for {activeAgentName}
                  </Button>
                </div>
                {invalidLines.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-medium">Could not save these lines:</p>
                    <ul className="mt-2 space-y-2">
                      {invalidLines.map((item) => (
                        <li key={item.line}>
                          <p className="truncate font-mono text-xs text-amber-900">{item.line}</p>
                          <p>{item.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
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

      {fetchResults && fetchResults.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-800">
          <p className="font-medium">Fetch results</p>
          <ul className="mt-2 space-y-1">
            {fetchResults.map((r) => (
              <li key={r.agent_slug}>
                <strong>{r.agent_name}:</strong>{" "}
                {r.error ? (
                  <span className="text-red-700">{r.error}</span>
                ) : (
                  <>
                    {r.fetched} found, {r.saved} saved
                    {r.skipped_duplicates > 0
                      ? ` (${r.skipped_duplicates} duplicate elsewhere)`
                      : ""}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {syncResult && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-800">
          <p className="font-medium">Sync results</p>
          <p className="mt-2">
            <strong>Added:</strong> {syncResult.added?.length ?? 0} draft(s)
          </p>
          <p>
            <strong>Skipped:</strong> {syncResult.skipped ?? 0} (already on HomeUP)
          </p>
          <p>
            <strong>Archived:</strong> {syncResult.archived?.length ?? 0}
          </p>
          <p>
            <strong>Failed:</strong> {syncResult.failed?.length ?? 0}
          </p>

          {(syncResult.added?.length ?? 0) > 0 && (
            <ul className="mt-3 list-inside list-disc text-neutral-600">
              {syncResult.added?.map((item) => (
                <li key={item.pg_url}>
                  {item.title} ({item.slug})
                </li>
              ))}
            </ul>
          )}

          {(syncResult.failed?.length ?? 0) > 0 && (
            <ul className="mt-3 list-inside list-disc text-red-700">
              {syncResult.failed?.map((item) => (
                <li key={item.pg_url}>
                  {item.pg_url}: {item.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
