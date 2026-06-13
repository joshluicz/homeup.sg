import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingsHero } from "@/components/sections/ListingsHero";
import { ListingsGrid } from "@/components/sections/ListingsGrid";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { LISTINGS } from "@/lib/data/listings";

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Property Listings Singapore",
  description:
    "Browse HomeUP's active HDB, Condo, and Landed property listings across Singapore. Every listing is handled by a CEA-licensed agent at a transparent fixed fee — HDB from $1,999, Condo from $4,999.",
  alternates: { canonical: "https://lp.homeup.sg/listings" },
  openGraph: {
    url: "https://lp.homeup.sg/listings",
    title: "Property Listings Singapore | HomeUP",
    description:
      "Browse active HDB, Condo, and Landed listings. Fixed-fee representation from $1,999. Enquire directly via WhatsApp.",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
//
// BACKEND INTEGRATION NOTE:
//   Replace `LISTINGS` with an async fetch when your CMS/API is ready:
//
//     import { getListings } from "@/lib/data/listings";
//     const listings = await getListings();
//
export default function ListingsPage() {
  // Ready for async: const listings = await getListings();
  const listings = LISTINGS;

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <ListingsHero />
        <ListingsGrid listings={listings} />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
