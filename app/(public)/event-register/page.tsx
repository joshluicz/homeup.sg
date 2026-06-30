import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "July 2026 Property Event – Register Now | HomeUP",
  description:
    "Join HomeUP's exclusive July 2026 Property Event in Singapore. Meet our CEA-licensed agents, get expert advice on buying or selling, and discover the best deals of the year.",
  robots: { index: false, follow: false },
};

const GOOGLE_FORM_EMBED_URL: string =
  "https://docs.google.com/forms/d/e/1FAIpQLSeCqQ33BT2QKF2kLfIM7iiKFKziehASRYbUT79qSW-EzNI_PQ/viewform?embedded=true";

const WHAT_TO_EXPECT = [
  "One-on-one consultations with CEA-licensed HomeUP agents",
  "Live market briefing — HDB, condo, landed & new launches",
  "Exclusive event-only pricing packages",
  "First-time buyer crash course",
  "Q&A panel with senior property advisors",
  "Lucky draw & networking session",
];

export default function EventRegisterPage() {
  const formReady = GOOGLE_FORM_EMBED_URL.includes("/forms/d/");

  return (
    <div className="min-h-screen bg-neutral-50 font-display">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        {/* subtle grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20 text-center">
          <span className="inline-block rounded-full bg-primary-500/30 border border-primary-400/40 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary-200 mb-5">
            Exclusive Event · July 2026 · Singapore
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight">
            HomeUP July 2026<br />Property Event
          </h1>
          <p className="text-primary-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you&apos;re buying your first home, upgrading, or looking to invest —
            join us for an exclusive evening with Singapore&apos;s top fixed-fee property
            advisors. Get personalised advice, market insights, and exclusive deals,
            all under one roof.
          </p>

          {/* Event meta pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            {[
              { icon: "📅", label: "Date: To be announced" },
              { icon: "📍", label: "Location: Singapore CBD" },
              { icon: "🎟", label: "Free entry — limited seats" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 font-medium text-white backdrop-blur-sm"
              >
                <span>{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-5xl px-6 py-14 grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* Left: sidebar info */}
        <aside className="lg:col-span-2 space-y-6">

          {/* What to expect */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-neutral-900 mb-4">What to expect</h2>
            <ul className="space-y-3">
              {WHAT_TO_EXPECT.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-neutral-600 leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* About HomeUP */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-2">
              About HomeUP
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed">
              CEA-licensed property agents under C&amp;H Properties Pte Ltd. We have closed
              1,000+ transactions with transparent pricing from&nbsp;$1,999 — no hidden fees,
              no percentage commissions.
            </p>
          </div>

          {/* Questions */}
          <div className="rounded-2xl bg-neutral-950 text-white p-6">
            <p className="font-bold text-sm mb-1">Questions?</p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Reach us at{" "}
              <a href="https://homeup.sg" className="text-primary-400 underline underline-offset-2 hover:text-primary-300 transition-colors">
                homeup.sg
              </a>{" "}
              or WhatsApp your agent directly.
            </p>
          </div>
        </aside>

        {/* Right: registration form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-primary-600 px-6 py-5">
              <h2 className="text-white font-bold text-lg">Register your spot</h2>
              <p className="text-primary-100 text-sm mt-0.5">Seats are limited — secure yours today.</p>
            </div>

            {formReady ? (
              <iframe
                src={GOOGLE_FORM_EMBED_URL}
                title="HomeUP July 2026 Event Registration Form"
                width="100%"
                height="1100"
                style={{ border: 0, display: "block" }}
              >
                Loading form…
              </iframe>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-2xl">
                  📋
                </div>
                <p className="font-semibold text-neutral-900 text-lg">Registration form coming soon</p>
                <p className="text-neutral-500 text-sm max-w-xs leading-relaxed">
                  Run <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs">createForm.gs</code> in Google Apps Script,
                  then paste the published form URL into{" "}
                  <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs">GOOGLE_FORM_EMBED_URL</code> in this page.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
