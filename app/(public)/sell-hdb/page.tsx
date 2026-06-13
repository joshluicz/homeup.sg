import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SellLandingContent } from "@/components/sections/SellLandingContent";
import { SELL_PAGE_HDB } from "@/lib/data/sell-pages";

const config = SELL_PAGE_HDB;

export const metadata: Metadata = {
  title: config.meta.title,
  description: config.meta.description,
  alternates: { canonical: "https://lp.homeup.sg/sell-hdb" },
  openGraph: {
    url: "https://lp.homeup.sg/sell-hdb",
    title: `${config.meta.title} | HomeUP`,
    description: config.meta.description,
  },
};

export default function SellHdbPage() {
  return (
    <>
      <Navbar />
      <main>
        <SellLandingContent config={config} />
      </main>
      <Footer />
    </>
  );
}
