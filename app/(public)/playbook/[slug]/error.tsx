"use client";

import Link from "next/link";

export default function PlaybookArticleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-page py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-red-500">Error</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 text-base text-neutral-500">
        This article failed to load. Please try again or return to the Playbook.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Try again
        </button>
        <Link
          href="/playbook"
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          ← Back to Playbook
        </Link>
      </div>
    </main>
  );
}
