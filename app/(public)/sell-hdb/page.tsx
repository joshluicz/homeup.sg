import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPageJsonLd } from "@/components/seo/LandingPageJsonLd";
import { SellLandingContent } from "@/components/sections/SellLandingContent";
import { SELL_FAQ_HDB } from "@/lib/data/faqs";
import { SELL_PAGE_HDB } from "@/lib/data/sell-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SELL_HOW_TO_STEPS } from "@/lib/seo/schema";

const config = SELL_PAGE_HDB;

export const metadata = buildPageMetadata({
  title: config.meta.title,
  description: config.meta.description,
  path: "/sell-hdb",
});

export default function SellHdbPage() {
  return (
    <>
      <LandingPageJsonLd
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Sell", path: "/sell" },
          { name: "Sell HDB", path: "/sell-hdb" },
        ]}
        faq={SELL_FAQ_HDB}
        howTo={{
          name: "How to sell your HDB flat with HomeUP",
          description:
            "HomeUP's fixed-fee HDB resale process from MOP review through to HDB completion.",
          steps: SELL_HOW_TO_STEPS,
        }}
        service={{
          name: "HomeUP HDB Selling Services",
          description: config.meta.description,
          path: "/sell-hdb",
          offers: [
            {
              name: "HDB Selling Package",
              price: "1999",
              description: "Full HDB resale service at a fixed fee of $1,999 + GST.",
            },
          ],
        }}
      />
      <Navbar />
      <main>
        <SellLandingContent config={config} />
      </main>
      <Footer />
    </>
  );
}
