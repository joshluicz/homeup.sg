import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { SyncKitHandoffDoc } from "@/components/admin/SyncKitHandoffDoc";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Sync Kit Guide | HomeUP Admin",
  description: "Overview and step-by-step guide for the local PropertyGuru listings sync kit.",
  path: "/admin/sync-kit-handoff",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
});

const HANDOFF_PATH = path.join(process.cwd(), "docs/listings-sync-kit-admin-handoff.md");
const SYNC_KIT_ZIP = "/downloads/homeup-listings-sync-kit.zip";

export default function SyncKitHandoffPage() {
  const content = fs.readFileSync(HANDOFF_PATH, "utf8");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-700">Batam / remote admin</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">Sync kit guide</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            PropertyGuru blocks our cloud server — run the kit on your PC to fetch listings and sync
            to homeup.sg. Follow the steps below; Joshua sends <code className="text-xs">.env.local</code>{" "}
            separately via 1Password.
          </p>
        </div>
        <a
          href={SYNC_KIT_ZIP}
          download="homeup-listings-sync-kit.zip"
          className="inline-flex shrink-0 rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
        >
          Download sync kit (ZIP)
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5">
          <h2 className="text-sm font-bold text-primary-950">Workflow A — Admin UI</h2>
          <p className="mt-2 text-sm text-primary-900">
            Review counts before syncing. Run <code className="text-xs">start-agent</code>, then use{" "}
            <Link href="/admin/listings/pg-sources" className="font-semibold underline">
              Listings Sync
            </Link>
            .
          </p>
          <p className="mt-2 text-xs font-medium text-primary-800">Best for first time</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-bold text-neutral-900">Workflow B — Full auto</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Double-click <code className="text-xs">run-full-sync</code> in the kit folder and wait for
            Done. No browser needed.
          </p>
          <p className="mt-2 text-xs font-medium text-neutral-500">Best for routine syncs</p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <SyncKitHandoffDoc content={content} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/listings/pg-sources"
          className="inline-flex rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          ← Back to Listings Sync
        </Link>
      </div>
    </div>
  );
}
