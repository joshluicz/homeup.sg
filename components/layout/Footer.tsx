import Link from "next/link";

const quickLinks: { label: string; href: string; external?: boolean }[] = [
  { label: "Services", href: "/#pricing" },
  { label: "Sell HDB", href: "/#pricing" },
  { label: "Sell Condo", href: "/#pricing" },
  { label: "Sell Landed", href: "/#pricing" },
  { label: "Buy", href: "/buy" },
  { label: "About", href: "/#agents" },
  { label: "Property Listing", href: "https://homeup.sg/property-listing/", external: true },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

export function Footer() {
  return (
    <footer aria-label="Footer" className="bg-neutral-950 text-neutral-50">
      <div className="container-page grid gap-10 py-16 lg:grid-cols-3">
        <div>
          <Link className="font-display text-3xl font-bold tracking-tight text-primary-500" href="/">
            HomeUP
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-300">
            More Value. Less Guesswork. Better Decisions.
          </p>
        </div>

        <div>
          <h2 className="font-body text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Quick Links
          </h2>
          <ul className="mt-4 grid gap-3 text-sm text-neutral-200">
            {quickLinks.map((link) => (
              <li key={link.label}>
                {link.external ? (
                  <a
                    className="transition-colors hover:text-primary-200"
                    href={link.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link className="transition-colors hover:text-primary-200" href={link.href}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-body text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Contact
          </h2>
          <div className="mt-4 grid gap-3 text-sm leading-relaxed text-neutral-200">
            <p>+65 8087 7015</p>
            <p>Mon–Sun 9am–9pm</p>
            <p>125A Lor 2 Toa Payoh #02-138</p>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-800">
        <div className="container-page py-6 text-xs leading-relaxed text-neutral-400">
          © 2026 HomeUP. All Rights Reserved. C &amp; H Properties Pte Ltd (CEA:
          L3007139C)
        </div>
      </div>
    </footer>
  );
}
