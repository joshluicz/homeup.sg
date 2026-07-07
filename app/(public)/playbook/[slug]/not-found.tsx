import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PlaybookArticleNotFound() {
  return (
    <>
      <Navbar />
      <main className="container-page py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">404</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
          Article not found
        </h1>
        <p className="mt-4 text-base text-neutral-500">
          This article may have been removed or the link is incorrect.
        </p>
        <Link
          href="/playbook"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          ← Back to Playbook
        </Link>
      </main>
      <Footer />
    </>
  );
}
