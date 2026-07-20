import Link from "next/link";
import { HomeUpLogo } from "@/components/ui/HomeUpLogo";
import { CEA_LICENSE, LEGAL_NAME, ORG_SAME_AS, SITE_VISION } from "@/lib/seo/constants";
import { SITE_LAST_UPDATED } from "@/lib/seo/content-freshness";

interface FooterLink {
  title: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const [visionLead, visionTail] = SITE_VISION.split(", ");
const visionMid = visionTail.replace("should finally be fair.", "");

const footerSections: FooterSection[] = [
  {
    label: "Sell",
    links: [
      { title: "Sell overview", href: "/sell" },
      { title: "Sell HDB", href: "/sell-hdb" },
      { title: "Sell condo", href: "/sell-condo" },
      { title: "Sell landed", href: "/sell-landed" },
    ],
  },
  {
    label: "Buy",
    links: [
      { title: "Buy overview", href: "/buy" },
      { title: "Buy HDB", href: "/buy-hdb" },
      { title: "Buy condo / landed", href: "/buy-condo-landed" },
      { title: "Buy new launch", href: "/buy-new-launch" },
    ],
  },
  {
    label: "Company",
    links: [
      { title: "About", href: "/about" },
      { title: "Our team", href: "/agents" },
      { title: "Credentials & awards", href: "/credentials" },
      { title: "Listings", href: "/listings" },
      { title: "Playbook", href: "/playbook" },
      { title: "Privacy policy", href: "/privacy-policy" },
    ],
  },
  {
    label: "Social",
    links: [
      { title: "Instagram", href: ORG_SAME_AS[0], external: true },
      { title: "TikTok", href: ORG_SAME_AS[1], external: true },
      { title: "Facebook", href: ORG_SAME_AS[2], external: true },
      { title: "YouTube", href: ORG_SAME_AS[3], external: true },
    ],
  },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "inline-flex items-center gap-1.5 text-neutral-400 transition-colors duration-300 hover:text-neutral-50";

  if (link.external) {
    return (
      <a
        href={link.href}
        className={className}
        rel="noopener noreferrer"
        target="_blank"
      >
        {link.title}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.title}
    </Link>
  );
}

export function Footer() {
  return (
    <footer aria-label="Footer" className="bg-neutral-950 text-neutral-50">
      <div className="container-page">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center rounded-t-4xl border-t border-neutral-800 bg-neutral-950 px-2 py-12 md:rounded-t-[2rem] lg:py-16">
          <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-10">
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <HomeUpLogo variant="wordmark-light" />
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-neutral-300">
                {visionLead},
                <br />
                {visionMid}
                <span className="text-primary-400">should finally be fair.</span>
              </p>
              <div className="space-y-1 text-sm text-neutral-400">
                <p>+65 8087 7015</p>
                <p>Mon to Sun, 9am to 9pm</p>
                <p>125A Lor 2 Toa Payoh #02-138</p>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 md:mt-2">
                Last updated: {SITE_LAST_UPDATED}
              </p>
              <p className="text-xs leading-relaxed text-neutral-500">
                © {new Date().getFullYear()} HOMEUP. All Rights Reserved. {LEGAL_NAME} (CEA:{" "}
                {CEA_LICENSE}).
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
              {footerSections.map((section) => (
                <div key={section.label} className="mb-8 md:mb-0">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {section.label}
                  </h2>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {section.links.map((link) => (
                      <li key={link.title}>
                        <FooterLinkItem link={link} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
