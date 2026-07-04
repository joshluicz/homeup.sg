import type { Metadata } from "next";
import { RentToaster } from "@/components/rent/RentToaster";
import { HomeUpLogo } from "@/components/ui/HomeUpLogo";

export const metadata: Metadata = {
  title: "List Your Rental | HomeUp Rent",
  description:
    "List your room or whole unit with HomeUp. Transparent fixed fee at $499 per room and $999 per whole unit. CEA-licensed agents.",
  robots: { index: true, follow: true },
};

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-center px-4 py-4 sm:max-w-xl">
          <HomeUpLogo variant="wordmark" />
        </div>
      </header>
      <main>{children}</main>
      <RentToaster />
      <footer className="border-t border-neutral-200 bg-white py-6">
        <p className="text-center text-sm text-neutral-500">
          HomeUp · CEA-licensed property agents · Fixed-fee rental listing
        </p>
      </footer>
    </div>
  );
}
