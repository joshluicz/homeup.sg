import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Listings Sync Kit | HomeUP Admin",
  description: "Download and setup instructions for the local PropertyGuru listings sync kit.",
  path: "/admin/listings/sync-kit",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
});

const SYNC_KIT_ZIP = "/downloads/homeup-listings-sync-kit.zip";

export default function ListingsSyncKitPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-700">
          HomeUP Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Listings sync kit</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Download this kit for Batam or any remote admin PC. PropertyGuru blocks cloud servers —
          the kit runs on your computer to fetch listing pages and sync them to homeup.sg.
        </p>
      </div>

      <section className="rounded-2xl border border-primary-200 bg-primary-50 p-6">
        <h2 className="text-sm font-semibold text-primary-950">Download</h2>
        <p className="mt-1 text-sm text-primary-900">
          Unzip on the admin PC. The kit includes SETUP.html with full instructions you can open
          offline.
        </p>
        <a
          href={SYNC_KIT_ZIP}
          download="homeup-listings-sync-kit.zip"
          className="mt-4 inline-flex rounded-xl bg-neutral-950 px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-neutral-800"
        >
          Download sync kit (ZIP)
        </a>
        <p className="mt-3 text-xs text-primary-800">
          After unzipping, open <code className="rounded bg-white/60 px-1">SETUP.html</code> in the
          kit folder for the printable step-by-step guide.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">Part 1 — One-time setup</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-neutral-700">
          <li>
            Install <strong>Node.js 20+</strong> from{" "}
            <a
              href="https://nodejs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-700 hover:underline"
            >
              nodejs.org
            </a>
            .
          </li>
          <li>Unzip the downloaded file to a folder on the admin PC (e.g. Desktop).</li>
          <li>
            Ask your team lead for <code className="text-xs">.env.local</code> and copy it into the
            unzipped folder. Never share this file or put it in the ZIP.
          </li>
          <li>
            <strong>Windows:</strong> double-click{" "}
            <code className="text-xs">first-time-setup.bat</code>
            <br />
            <strong>Mac:</strong> right-click{" "}
            <code className="text-xs">first-time-setup.command</code> → Open (first time only)
          </li>
          <li>Wait for &quot;Setup complete&quot; — installs npm packages and Patchright Chrome.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">
          Part 2 — Workflow A (admin UI)
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Use when you want to review sheet counts before syncing.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-neutral-700">
          <li>
            Run <code className="text-xs">start-agent</code> (
            <code className="text-xs">.bat</code> or <code className="text-xs">.command</code>) and{" "}
            <strong>keep the window open</strong>.
          </li>
          <li>
            Open{" "}
            <Link href="/admin/listings/pg-sources" className="font-medium text-primary-700 hover:underline">
              Listings Sync
            </Link>{" "}
            and sign in to admin.
          </li>
          <li>Confirm the green banner: &quot;Local agent is running&quot;.</li>
          <li>Click <strong>Refresh from Google Sheet</strong>.</li>
          <li>Review import and archive counts.</li>
          <li>
            Click <strong>Sync to HomeUP</strong>. Listings publish to the live site immediately.
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">
          Part 3 — Workflow B (full auto sync)
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          One-click sync without using the admin UI.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-neutral-700">
          <li>
            Double-click <code className="text-xs">run-full-sync</code>.
          </li>
          <li>Wait until the terminal shows Done (may take several minutes).</li>
          <li>
            Verify at{" "}
            <a
              href="https://homeup.sg/listings"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-700 hover:underline"
            >
              homeup.sg/listings
            </a>
            .
          </li>
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <h3 className="text-sm font-bold text-neutral-900">Windows security</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Only run scripts from the unzipped kit folder. If Smart App Control blocks something,
            close the dialog and open files from the kit folder only.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <h3 className="text-sm font-bold text-neutral-900">Mac Gatekeeper</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Right-click the <code className="text-xs">.command</code> file → Open → Open again the
            first time. You only need to do this once per script.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/sync-kit-handoff"
          className="inline-flex rounded-xl border border-primary-200 bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-900 hover:bg-primary-100"
        >
          Full handoff guide →
        </Link>
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
