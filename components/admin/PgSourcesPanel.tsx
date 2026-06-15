"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AGENTS } from "@/lib/data/agents";
import {
  loadPgSources,
  savePgSourcesForAgent,
  type PgListingSource,
} from "@/lib/listings/pg-sources-client";
import type { InvalidPgLine } from "@/lib/listings/pg-url";
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
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [invalidLines, setInvalidLines] = useState<InvalidPgLine[]>([]);

  const canSync = isLocalDevHost();

  const sourcesByAgent = useMemo(() => {
    const map = new Map<string, PgListingSource[]>();
    for (const source of sources) {
      const list = map.get(source.agent_slug) ?? [];
      list.push(source);
      map.set(source.agent_slug, list);
    }
    return map;
  }, [sources]);

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

  async function handleSave() {
    if (!activeAgent) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(null);
    setInvalidLines([]);

    const agentName = AGENTS.find((a) => a.slug === activeAgent)?.name ?? activeAgent;

    try {
      const { saved, invalid } = await savePgSourcesForAgent(
        activeAgent,
        drafts[activeAgent] ?? "",
      );

      setInvalidLines(invalid);

      if (saved === 0 && invalid.length === 0) {
        setSaveSuccess(`Cleared all saved links for ${agentName}.`);
      } else if (saved === 0 && invalid.length > 0) {
        setSaveSuccess(`Nothing saved — all lines were invalid URLs. Check the warnings below.`);
      } else {
        setSaveSuccess(`Saved ${saved} link${saved === 1 ? "" : "s"} for ${agentName}.`);
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
    setSaveSuccess(null);
    setSyncResult(null);

    try {
      const res = await fetch("/api/listings/sync-pg", { method: "POST" });
      const text = await res.text();
      let json: SyncResponse;
      try {
        json = JSON.parse(text) as SyncResponse;
      } catch {
        throw new Error(
          "Sync API unavailable. Run npm run dev on localhost and try again.",
        );
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Sync failed");
      }
      setSyncResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

  const activeAgentName = AGENTS.find((a) => a.slug === activeAgent)?.name ?? activeAgent;
  const agentSourceCount = sourcesByAgent.get(activeAgent)?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">PropertyGuru sources</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Pick an agent, then paste that agent&apos;s <strong>property listing links</strong> (one
          per line). Sync imports those listings as drafts.
        </p>
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-medium">Not the agent profile link</p>
          <p className="mt-1 text-blue-800">
            Don&apos;t paste <code className="text-xs">…/agent/dennis-lim-…</code>. Open each
            property on PropertyGuru → copy the URL from your browser. It should look like{" "}
            <code className="text-xs">…/listing/for-sale-ecopolitan-500167641</code>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading saved links…
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {AGENTS.map((agent) => (
                <button
                  key={agent.slug}
                  type="button"
                  onClick={() => {
                    setActiveAgent(agent.slug);
                    setSaveSuccess(null);
                    setError(null);
                  }}
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

            <p className="mb-3 text-sm text-neutral-600">
              {activeAgentName} — {agentSourceCount} saved link(s)
            </p>

            <textarea
              className={cn(inputClass, "min-h-[220px] font-mono text-xs")}
              value={drafts[activeAgent] ?? ""}
              onChange={(e) => {
                setSaveSuccess(null);
                setDrafts((prev) => ({ ...prev, [activeAgent]: e.target.value }));
              }}
              placeholder={"https://www.propertyguru.com.sg/listing/for-sale-example-500167641\n..."}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save links
              </Button>
            </div>

            {saveSuccess && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {invalidLines.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium">Could not save these lines:</p>
                <ul className="mt-2 space-y-2">
                  {invalidLines.map((item) => (
                    <li key={item.line}>
                      <p className="truncate font-mono text-xs text-amber-900">{item.line}</p>
                      <p className="text-amber-800">{item.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-neutral-900">Sync listings</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Imports new links as drafts. Skips listings already on HomeUP. Archives listings
              whose links you removed from the saved lists.
            </p>

            {!canSync && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Sync only works on localhost — run <code className="text-xs">npm run dev</code>{" "}
                and open this page there.
              </p>
            )}

            <div className="mt-4">
              <Button type="button" onClick={handleSync} disabled={syncing || !canSync}>
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sync from saved links
              </Button>
            </div>

            {syncing && (
              <p className="mt-3 text-sm text-neutral-600">
                Syncing… this can take a while for new listings.
              </p>
            )}
          </section>
        </>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {syncResult && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-800">
          <p className="font-medium text-green-700">Sync finished.</p>
          <p className="mt-2">
            <strong>Added:</strong> {syncResult.added?.length ?? 0} draft(s)
          </p>
          <p>
            <strong>Skipped:</strong> {syncResult.skipped ?? 0} (already imported)
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
