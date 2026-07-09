"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MIN_SAMPLE } from "@/lib/pipeline/transactions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CohortRow {
  propertyType: string;
  town: string;
  count: number;
  minYear: number;
  maxYear: number;
  meetsMinSample: boolean;
}

const CSV_SPEC = `property_type,town,segment,sold_price,days_on_market,net_vs_valuation,year
HDB,Tampines,4-room,520000,42,3.50,2024
HDB,Woodlands,5-room,480000,38,1.20,2024
Condo,Bishan,,980000,55,2.10,2024`.trim();

// ── Component ─────────────────────────────────────────────────────────────────

export function TransactionsTab() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    imported?: number;
    skippedErrors?: number;
    parseErrors?: string[];
    error?: string;
  } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/transactions");
    if (res.ok) setCohorts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setUploadResult({ error: "Please upload a .csv file." });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/admin/transactions", { method: "POST", body: form });
    const data = await res.json();

    setUploadResult(data);
    setUploading(false);

    if (res.ok) load();
  }, [load]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Delete all ────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    await fetch("/api/admin/transactions", { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(false);
    load();
  }, [load]);

  // ── Totals ────────────────────────────────────────────────────────────────

  const totalRows = cohorts.reduce((s, c) => s + c.count, 0);
  const activeRows = cohorts.filter((c) => c.meetsMinSample).reduce((s, c) => s + c.count, 0);
  const activeCohorts = cohorts.filter((c) => c.meetsMinSample).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Admin</p>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Transaction Data</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Upload HomeUP&apos;s own sales data — used to inject first-party stats into AI-generated articles.
          Individual rows are never surfaced; only aggregates with ≥{MIN_SAMPLE} sales per cohort.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total rows", value: loading ? "…" : totalRows.toLocaleString() },
          { label: `Active cohorts (≥${MIN_SAMPLE} sales)`, value: loading ? "…" : activeCohorts.toString() },
          { label: "Rows in active cohorts", value: loading ? "…" : activeRows.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-0.5 text-lg font-bold text-neutral-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-xs text-emerald-800">
          <span className="font-semibold">Privacy guarantee:</span> cohorts with fewer than {MIN_SAMPLE} transactions are silently excluded from all prompts and API responses. No individual sale is ever surfaced. The aggregate stats are the only output.
        </p>
      </div>

      {/* CSV Upload */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-neutral-900">
          <Upload className="h-4 w-4 text-primary-600" />
          Upload CSV
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Data is appended — existing rows are kept. Use &quot;Clear all data&quot; first if you want a full replacement.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging
              ? "border-primary-400 bg-primary-50"
              : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white",
          )}
        >
          <FileText className={cn("h-8 w-8", dragging ? "text-primary-500" : "text-neutral-300")} />
          <div>
            <p className="text-sm font-semibold text-neutral-700">
              {uploading ? "Uploading…" : "Drop a CSV here or click to browse"}
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">Accepts .csv files only</p>
          </div>
          {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary-600" />}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </div>

        {/* Upload result */}
        {uploadResult && (
          <div className={cn(
            "mt-3 rounded-lg border px-4 py-3",
            uploadResult.error
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50",
          )}>
            {uploadResult.error ? (
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-700">{uploadResult.error}</p>
                  {uploadResult.parseErrors && (
                    <ul className="mt-1 space-y-0.5">
                      {uploadResult.parseErrors.map((e, i) => (
                        <li key={i} className="text-xs text-red-600 before:mr-1 before:content-['•']">{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    {uploadResult.imported?.toLocaleString()} rows imported
                    {uploadResult.skippedErrors ? `, ${uploadResult.skippedErrors} rows skipped (validation errors)` : ""}
                  </p>
                  {uploadResult.parseErrors && uploadResult.parseErrors.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {uploadResult.parseErrors.map((e, i) => (
                        <li key={i} className="text-xs text-amber-700 before:mr-1 before:content-['•']">{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSV spec accordion */}
        <details className="mt-4">
          <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-700">
            <ChevronDown className="h-3.5 w-3.5" />
            CSV format spec
          </summary>
          <div className="mt-2 rounded-lg bg-neutral-900 p-4">
            <pre className="overflow-x-auto text-xs leading-relaxed text-emerald-300">{CSV_SPEC}</pre>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-neutral-500">
            <li><span className="font-semibold text-neutral-700">property_type</span> — required: HDB | Condo | EC | Landed</li>
            <li><span className="font-semibold text-neutral-700">town</span> — required: e.g. Tampines, Woodlands, Bishan</li>
            <li><span className="font-semibold text-neutral-700">segment</span> — optional: e.g. 4-room, High-floor</li>
            <li><span className="font-semibold text-neutral-700">sold_price</span> — required: integer SGD, e.g. 520000</li>
            <li><span className="font-semibold text-neutral-700">days_on_market</span> — required: integer, e.g. 42</li>
            <li><span className="font-semibold text-neutral-700">net_vs_valuation</span> — optional: decimal %, e.g. 3.50 or -1.20</li>
            <li><span className="font-semibold text-neutral-700">year</span> — required: 4-digit year, e.g. 2024</li>
          </ul>
        </details>
      </div>

      {/* Cohort table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
            <Database className="h-4 w-4 text-primary-600" />
            Cohort summary
            {!loading && (
              <span className="ml-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                {cohorts.length} cohorts
              </span>
            )}
          </h2>

          {/* Danger: clear all */}
          {cohorts.length > 0 && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all data
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-semibold">Delete all rows?</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="border-neutral-200 text-neutral-600"
              >
                Cancel
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm delete
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-5 pb-8 pt-2 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : cohorts.length === 0 ? (
          <div className="px-5 pb-10 pt-2 text-center text-sm text-neutral-400">
            No transaction data yet — upload a CSV to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-neutral-100 bg-neutral-50">
                  {["Property type", "Town", "Sales", "Years", "Used in AI"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-t border-neutral-100",
                      !c.meetsMinSample && "opacity-50",
                    )}
                  >
                    <td className="px-5 py-3 font-medium text-neutral-900">{c.propertyType}</td>
                    <td className="px-5 py-3 text-neutral-700">{c.town}</td>
                    <td className="px-5 py-3 tabular-nums text-neutral-700">{c.count}</td>
                    <td className="px-5 py-3 tabular-nums text-neutral-500">
                      {c.minYear === c.maxYear ? c.minYear : `${c.minYear}–${c.maxYear}`}
                    </td>
                    <td className="px-5 py-3">
                      {c.meetsMinSample ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Yes</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-neutral-400">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          <span className="text-xs">Needs ≥{MIN_SAMPLE}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
