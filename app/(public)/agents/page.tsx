import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { AgentsDirectory } from "@/components/sections/AgentsDirectory";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { AGENTS } from "@/lib/data/agents";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, personSchema } from "@/lib/seo/schema";

export const metadata = buildPageMetadata({
  title: "Our Agents",
  description:
    "Meet HomeUP's CEA-licensed property advisors, experienced across HDB, condo, and landed sales and purchases in Singapore.",
  path: "/agents",
});

export default function AgentsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Our Agents", path: "/agents" },
          ]),
          ...AGENTS.map((agent) => personSchema(agent)),
        ]}
      />
      <Navbar />
      <main>
        <AgentsDirectory />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
