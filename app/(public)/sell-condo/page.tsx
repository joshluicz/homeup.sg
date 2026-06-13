import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPageJsonLd } from "@/components/seo/LandingPageJsonLd";
import { SellLandingContent } from "@/components/sections/SellLandingContent";
import { SELL_FAQ_CONDO } from "@/lib/data/faqs";
import { SELL_PAGE_CONDO } from "@/lib/data/sell-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SELL_HOW_TO_STEPS } from "@/lib/seo/schema";

const config = SELL_PAGE_CONDO;

export const metadata = buildPageMetadata({
  title: config.meta.title,
  description: config.meta.description,
  path: "/sell-condo",
});

export default function SellCondoPage() {
  return (
    <>
      <LandingPageJsonLd
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Sell", path: "/sell" },
          { name: "Sell Condo", path: "/sell-condo" },
        ]}
        faq={SELL_FAQ_CONDO}
        howTo={{
          name: "How to sell your condo with HomeUP",
          description:
            "HomeUP's fixed-fee condo resale process from listing through to legal completion.",
          steps: SELL_HOW_TO_STEPS,
        }}
        service={{
          name: "HomeUP Condo Selling Services",
          description: config.meta.description,
          path: "/sell-condo",
          offers: [
            {
              name: "Condo/EC Selling Package",
              price: "4999",
              description: "Full condo resale service at a fixed fee of $4,999 + GST.",
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
