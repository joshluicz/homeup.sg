import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionBlendTop } from "@/components/ui/SectionBlend";
import { FadeInUp } from "@/components/ui/motion-primitives";

const SOCIALS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/homeup_singapore?igsh=dXVwcXJ5b2drZjJn",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    hover: "hover:bg-pink-600 hover:border-pink-600",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@homeup.sg?_r=1&_t=ZS-96yiWW0nuFR",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
      </svg>
    ),
    hover: "hover:bg-neutral-900 hover:border-neutral-900",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1GmU7rZQfK/?mibextid=wwXIfr",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    hover: "hover:bg-blue-600 hover:border-blue-600",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@homeupdennis?si=5nownSGN7VO7xTQa",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    hover: "hover:bg-red-600 hover:border-red-600",
  },
] as const;

export function SocialPanel() {
  return (
    <section aria-label="Follow HOMEUP on social media" className="relative overflow-hidden bg-primary-50 py-12 sm:py-14">
      <SectionBlendTop from="neutral-50" />
      <div className="container-page">
        <FadeInUp>
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <Eyebrow>Stay Connected</Eyebrow>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Follow HOMEUP
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
              Tips, market updates, and behind-the-scenes from our team.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow HOMEUP on ${s.name}`}
                  className={[
                    "inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all duration-200",
                    "hover:text-white hover:shadow-md",
                    s.hover,
                  ].join(" ")}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
