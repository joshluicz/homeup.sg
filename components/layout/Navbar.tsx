"use client";

import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { HomeUpLogo } from "@/components/ui/HomeUpLogo";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Buy", href: "/buy" },
  { label: "Listings", href: "/listings" },
  { label: "Playbook", href: "/playbook" },
  { label: "Our Team", href: "/#agents" },
];

const whatsappUrl = "https://wa.me/6580877015";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();

  const borderRadius = useTransform(scrollY, [0, 80], [0, 20]);
  const mx = useTransform(scrollY, [0, 80], [0, 16]);
  const mt = useTransform(scrollY, [0, 80], [0, 8]);
  const bgAlpha = useTransform(scrollY, [0, 60], [0.9, 0.98]);
  const shadow = useTransform(
    scrollY,
    [0, 80],
    ["0 0 0 0 transparent", "0 4px 24px rgba(0,0,0,0.08)"],
  );
  const borderAlpha = useTransform(scrollY, [0, 80], [0, 1]);
  const bgColor = useMotionTemplate`rgba(255,255,255,${bgAlpha})`;

  return (
    <div className="sticky top-0 z-50">
      <motion.div style={{ paddingLeft: mx, paddingRight: mx, paddingTop: mt }}>
        <motion.nav
          aria-label="Primary navigation"
          style={{
            borderRadius,
            backgroundColor: bgColor,
            boxShadow: shadow,
            borderColor: `rgba(228,227,223,${borderAlpha.get()})`,
          }}
          className="border border-transparent backdrop-blur-md"
        >
          <div className="container-page flex items-center justify-between py-4">
            <Link href="/" onClick={() => setIsOpen(false)} className="shrink-0">
              <HomeUpLogo
                variant="wordmark"
                imageClassName="h-12 w-auto sm:h-14 lg:h-16"
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-8 lg:flex">
              <div className="flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    className="font-body text-sm font-medium tracking-wide text-neutral-600 transition-colors hover:text-neutral-900"
                    href={link.href}
                    key={link.label}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <Button size="sm" asChild>
                <a href={whatsappUrl} rel="noopener noreferrer" target="_blank" className="gap-2">
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  Book a Call
                </a>
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-800 lg:hidden"
              onClick={() => setIsOpen((c) => !c)}
              type="button"
            >
              {isOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </motion.nav>
      </motion.div>

      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 top-20 z-40 bg-white px-6 py-8 lg:hidden"
          initial={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                className="font-display text-3xl font-semibold tracking-tight text-neutral-900"
                href={link.href}
                key={link.label}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button className="mt-4" asChild>
              <a href={whatsappUrl} rel="noopener noreferrer" target="_blank" className="gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Book a Call
              </a>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
