"use client";

import { MessageCircle } from "lucide-react";
import { trackButtonClick } from "@/lib/analytics";

type ListingWhatsAppButtonProps = {
  href: string;
  label?: string;
};

export function ListingWhatsAppButton({
  href,
  label = "Enquire on WhatsApp",
}: ListingWhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackButtonClick("Enquire on WhatsApp - Listing Detail")}
      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}
