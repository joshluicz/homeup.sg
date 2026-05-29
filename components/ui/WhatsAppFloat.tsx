"use client";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const WA = "https://wa.me/6580877015";

export function WhatsAppFloat() {
  return (
    <a
      href={WA}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
