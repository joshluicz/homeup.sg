"use client";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { whatsAppUrlFor } from "@/lib/whatsapp";
import { trackWhatsAppClick } from "@/lib/analytics";

const WA = whatsAppUrlFor("float");

export function WhatsAppFloat() {
  const pathname = usePathname();

  if (pathname?.startsWith("/roadshow")) return null;

  return (
    <a
      href={WA}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Us"
      onClick={() => trackWhatsAppClick(pathname)}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
