import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "July 2026 Property Event – Register Now | HomeUP",
  description:
    "Join HomeUP's exclusive July 2026 Property Event in Singapore. Meet our CEA-licensed agents, get expert advice on buying or selling, and discover the best deals of the year.",
  robots: { index: false, follow: false }, // keep registration page out of search results
};

// ── Paste your Google Form published URL here once the form is created ──────
// It looks like: https://docs.google.com/forms/d/e/<long-id>/viewform?embedded=true
const GOOGLE_FORM_EMBED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe1TJ1YKWCPMz1j_4bQx06nQ3OYHLLR_uwfyeVpVq9cjj-Wfw/viewform?embedded=true";
// ────────────────────────────────────────────────────────────────────────────

export default function EventRegisterPage() {
  const formReady = GOOGLE_FORM_EMBED_URL !== "PASTE_YOUR_GOOGLE_FORM_EMBED_URL_HERE";

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans">
      {/* ── Header ── */}
      <header className="bg-[#1B3A6B] text-white">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <a href="/" aria-label="HomeUP homepage">
            <Image
              src="/images/homeup-logo-wordmark-light.svg"
              alt="HomeUP"
              width={140}
              height={36}
              priority
            />
          </a>
          <span className="text-sm font-medium text-[#F5A623] tracking-wide uppercase">
            July 2026 Property Event
          </span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#1B3A6B] text-white pb-16 pt-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-3 text-[#F5A623] text-sm font-semibold uppercase tracking-widest">
            Exclusive Event · July 2026 · Singapore
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-5">
            HomeUP July 2026<br />Property Event
          </h1>
          <p className="text-blue-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Whether you're buying your first home, upgrading, or looking to invest —
            join us for an exclusive evening with Singapore's top fixed-fee property
            advisors. Get personalised advice, market insights, and exclusive deals,
            all under one roof.
          </p>
        </div>
      </section>

      {/* ── Event detail pills ── */}
      <div className="bg-[#F5A623]">
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-wrap justify-center gap-6 text-[#1B3A6B] font-semibold text-sm">
          <span>📅 &nbsp;Date: To be announced</span>
          <span>📍 &nbsp;Location: Singapore CBD</span>
          <span>🎟 &nbsp;Free entry — limited seats</span>
        </div>
      </div>

      {/* ── Main content: highlights + form ── */}
      <main className="mx-auto max-w-5xl px-6 py-14 grid grid-cols-1 lg:grid-cols-5 gap-12">

        {/* Left: what to expect */}
        <aside className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-[#1B3A6B] mb-4">What to expect</h2>
            <ul className="space-y-3 text-gray-700 text-sm leading-relaxed">
              {[
                "One-on-one consultations with CEA-licensed HomeUP agents",
                "Live market briefing — HDB, condo, landed & new launches",
                "Exclusive event-only pricing packages",
                "First-time buyer crash course",
                "Q&A panel with senior property advisors",
                "Lucky draw & networking session",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="text-[#F5A623] font-bold flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-2">
              About HomeUP
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              HomeUP is Singapore's fixed-fee property agency operated by C&amp;H Properties
              Pte Ltd. We've closed 1,000+ transactions with transparent pricing from&nbsp;$1,999
              — no hidden fees, no percentage commissions.
            </p>
          </div>

          <div className="rounded-xl bg-[#1B3A6B] text-white p-5">
            <p className="font-bold mb-1">Questions?</p>
            <p className="text-sm text-blue-200">
              Reach us at{" "}
              <a href="https://homeup.sg" className="text-[#F5A623] underline">
                homeup.sg
              </a>{" "}
              or WhatsApp your agent directly.
            </p>
          </div>
        </aside>

        {/* Right: Google Form embed */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
            <div className="bg-[#1B3A6B] px-6 py-4">
              <h2 className="text-white font-bold text-lg">Register your spot</h2>
              <p className="text-blue-200 text-sm">Seats are limited — secure yours today.</p>
            </div>

            {formReady ? (
              <iframe
                src={GOOGLE_FORM_EMBED_URL}
                title="HomeUP July 2026 Event Registration Form"
                width="100%"
                height="1100"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                className="block"
              >
                Loading form…
              </iframe>
            ) : (
              /* Placeholder shown until the Google Form URL is added */
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl">
                  📋
                </div>
                <p className="font-semibold text-[#1B3A6B] text-lg">Registration form coming soon</p>
                <p className="text-gray-500 text-sm max-w-xs">
                  Run <code className="bg-gray-100 px-1 rounded">createForm.gs</code> in Google Apps Script,
                  then paste the published form URL into{" "}
                  <code className="bg-gray-100 px-1 rounded">GOOGLE_FORM_EMBED_URL</code> in this page.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#1B3A6B] text-blue-200 text-center py-6 text-xs">
        <p>
          © {new Date().getFullYear()} HomeUP · Operated by C&amp;H Properties Pte Ltd ·{" "}
          <a href="/privacy-policy" className="underline hover:text-white">
            Privacy Policy
          </a>
        </p>
      </footer>
    </div>
  );
}
