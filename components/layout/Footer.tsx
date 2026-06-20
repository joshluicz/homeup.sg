"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { HomeUpLogo } from "@/components/ui/HomeUpLogo";
import { CEA_LICENSE, LEGAL_NAME, ORG_SAME_AS } from "@/lib/seo/constants";
import { SITE_LAST_UPDATED } from "@/lib/seo/content-freshness";

interface FooterLink {
  title: string;
  href: string;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

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
      { title: "Listings", href: "/listings" },
      { title: "Playbook", href: "/playbook" },
      { title: "Privacy policy", href: "/privacy-policy" },
    ],
  },
  {
    label: "Social",
    links: [
      { title: "Instagram", href: ORG_SAME_AS[0], external: true, icon: Instagram },
      { title: "TikTok", href: ORG_SAME_AS[1], external: true },
      { title: "Facebook", href: ORG_SAME_AS[2], external: true, icon: Facebook },
      { title: "YouTube", href: ORG_SAME_AS[3], external: true, icon: Youtube },
    ],
  },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const Icon = link.icon;
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
        {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
        {link.title}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {link.title}
    </Link>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Footer() {
  return (
    <footer
      aria-label="Footer"
      className="bg-neutral-950 text-neutral-50"
    >
      <div className="container-page">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center rounded-t-4xl border-t border-neutral-800 bg-[radial-gradient(35%_128px_at_50%_0%,rgba(255,255,255,0.08),transparent)] px-2 py-12 md:rounded-t-[2rem] lg:py-16">
          <div
            aria-hidden="true"
            className="absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-50/20 blur-sm"
          />

          <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-10">
            <AnimatedContainer className="space-y-4">
              <Link href="/" className="inline-block">
                <HomeUpLogo variant="wordmark-light" />
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-neutral-300">
                More Value. Less Guesswork. Better Decisions.
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
            </AnimatedContainer>

            <div className="mt-4 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
              {footerSections.map((section, index) => (
                <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
                  <div className="mb-8 md:mb-0">
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
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
