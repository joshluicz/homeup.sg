"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ListingFormData } from "@/lib/listings/types";
import { postListingImport } from "@/lib/listings/import/client";
import { parsePgListingUrl } from "@/lib/listings/pg-url";
import { Loader2 } from "lucide-react";

type ImportResult = {
  data: Partial<ListingFormData>;
  warnings: string[];
};

type ListingImportPanelProps = {
  listingId: string;
  onSuccess: (result: ImportResult) => void;
};

type ImportStep = "idle" | "fetching" | "extracting" | "uploading";

const STEP_LABELS: Record<ImportStep, string> = {
  idle: "",
  fetching: "Fetching listing page…",
  extracting: "Extracting listing data…",
  uploading: "Uploading images…",
};

export function ListingImportPanel({ listingId, onSuccess }: ListingImportPanelProps) {
  const [url, setUrl] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [showFallback, setShowFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<ImportStep>("idle");
  const [error, setError] = useState<string | null>(null);

  async function runImport(payload: { url?: string; html?: string }) {
    setLoading(true);
    setError(null);

    if (payload.url) setStep("fetching");
    else setStep("extracting");

    try {
      const extractTimer = setTimeout(() => setStep("extracting"), 1500);
      const uploadTimer = setTimeout(() => setStep("uploading"), 4000);

      clearTimeout(extractTimer);
      clearTimeout(uploadTimer);

      const result = await postListingImport({ ...payload, listingId });

      if (result.error) {
        if (result.error === "FETCH_BLOCKED") {
          setShowFallback(true);
          setError(
            "PropertyGuru blocked the server fetch. Paste the page HTML or listing content below instead.",
          );
          return;
        }
        setError(result.error);
        return;
      }

      onSuccess({
        data: {
          ...(result.data ?? {}),
          ...(payload.url
            ? (() => {
                const parsed = parsePgListingUrl(payload.url);
                return parsed
                  ? {
                      source_pg_url: parsed.pg_url,
                      source_pg_listing_id: parsed.pg_listing_id,
                    }
                  : {};
              })()
            : {}),
        },
        warnings: result.warnings ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  }

  function handleFetchExtract() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a PropertyGuru listing URL");
      return;
    }
    runImport({ url: trimmed });
  }

  function handlePasteExtract() {
    const trimmed = pastedHtml.trim();
    if (!trimmed) {
      setError("Paste the page HTML or listing content");
      return;
    }
    runImport({ html: trimmed });
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">
          Import from PropertyGuru
        </h2>
        <p className="mb-5 text-sm text-neutral-600">
          Paste a PropertyGuru listing URL to auto-fill the form. You can review and
          edit all fields before saving.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              PropertyGuru listing URL
            </label>
            <input
              type="url"
              className={inputClass}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.propertyguru.com.sg/listing/for-sale-..."
              disabled={loading}
            />
          </div>

          <Button onClick={handleFetchExtract} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Fetch &amp; Extract
          </Button>

          {loading && step !== "idle" && (
            <p className="text-sm text-neutral-600">{STEP_LABELS[step]}</p>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!showFallback && (
            <button
              type="button"
              onClick={() => setShowFallback(true)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Having trouble?
            </button>
          )}
        </div>
      </section>

      {showFallback && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-900">
            Paste page content
          </h2>
          <p className="mb-5 text-sm text-neutral-600">
            Open the listing in your browser, then either right-click → View Page
            Source and copy the HTML, or copy the visible listing details and paste
            below.
          </p>

          <textarea
            className={cn(inputClass, "min-h-[200px] font-mono text-xs")}
            value={pastedHtml}
            onChange={(e) => setPastedHtml(e.target.value)}
            placeholder="Paste HTML or listing text here…"
            disabled={loading}
          />

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={handlePasteExtract}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Extract from pasted content
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
