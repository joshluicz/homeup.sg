import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AgentsDirectory } from "@/components/sections/AgentsDirectory";
import { CtaBanner } from "@/components/sections/CtaBanner";

export const metadata: Metadata = {
  title: "Our Agents",
  description:
    "Meet HomeUP's CEA-licensed property advisors — experienced across HDB, condo, and landed sales and purchases in Singapore.",
  alternates: { canonical: "https://lp.homeup.sg/agents" },
  openGraph: {
    url: "https://lp.homeup.sg/agents",
    title: "Our Agents | HomeUP",
    description:
      "Meet HomeUP's CEA-licensed property advisors — fixed-fee experts across selling, buying, and upgrading in Singapore.",
  },
};

export default function AgentsPage() {
  return (
    <>
      <Navbar />
      <main>
        <AgentsDirectory />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
