import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BuyLandingContent } from "@/components/sections/BuyLandingContent";
import { BUY_PAGE_NEW_LAUNCH } from "@/lib/data/buy-pages";

const config = BUY_PAGE_NEW_LAUNCH;

export const metadata: Metadata = {
  title: config.meta.title,
  description: config.meta.description,
  alternates: { canonical: "https://lp.homeup.sg/buy-new-launch" },
  openGraph: {
    url: "https://lp.homeup.sg/buy-new-launch",
    title: `${config.meta.title} | HomeUP`,
    description: config.meta.description,
  },
};

export default function BuyNewLaunchPage() {
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
