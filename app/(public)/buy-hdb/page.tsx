import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BuyLandingContent } from "@/components/sections/BuyLandingContent";
import { BUY_PAGE_HDB } from "@/lib/data/buy-pages";

const config = BUY_PAGE_HDB;

export const metadata: Metadata = {
  title: config.meta.title,
  description: config.meta.description,
  alternates: { canonical: "https://lp.homeup.sg/buy-hdb" },
  openGraph: {
    url: "https://lp.homeup.sg/buy-hdb",
    title: `${config.meta.title} | HomeUP`,
    description: config.meta.description,
  },
};

export default function BuyHdbPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <BuyLandingContent config={config} />
      </main>
      <Footer />
    </>
  );
}
