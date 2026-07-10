import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { SyncKitHandoffDoc } from "@/components/admin/SyncKitHandoffDoc";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Sync Kit Handoff | HomeUP Admin",
  description: "Batam admin team handoff guide for the local PropertyGuru listings sync kit.",
  path: "/admin/sync-kit-handoff",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
});

const HANDOFF_PATH = path.join(process.cwd(), "docs/listings-sync-kit-admin-handoff.md");

export default function SyncKitHandoffPage() {
  const content = fs.readFileSync(HANDOFF_PATH, "utf8");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-700">Admin only</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">Sync kit handoff</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Full Batam team guide. Send <code className="text-xs">.env.local</code> separately via
            1Password — never in this page or the ZIP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/listings/sync-kit"
            className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Setup &amp; download
          </Link>
          <a
            href="/downloads/homeup-listings-sync-kit.zip"
            download="homeup-listings-sync-kit.zip"
            className="inline-flex rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800"
          >
            Download ZIP
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <SyncKitHandoffDoc content={content} />
      </div>
    </div>
  );
}
