import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPageJsonLd } from "@/components/seo/LandingPageJsonLd";
import { SellLandingContent } from "@/components/sections/SellLandingContent";
import { SELL_FAQ_GENERAL, faqItemsForSchema } from "@/lib/data/faqs";
import { SELL_PAGE_GENERAL } from "@/lib/data/sell-pages";
import { getListingStatsServer } from "@/lib/listings/server-queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SELL_HOW_TO_STEPS } from "@/lib/seo/schema";

const config = SELL_PAGE_GENERAL;

export const metadata = buildPageMetadata({
  title: config.meta.title,
  description: config.meta.description,
  path: "/sell",
});

export default async function SellPage() {
  const stats = await getListingStatsServer();

  return (
    <>
      <LandingPageJsonLd
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Sell", path: "/sell" },
        ]}
        faq={faqItemsForSchema(SELL_FAQ_GENERAL, stats.total)}
        howTo={{
          name: "How to sell your property with HomeUP",
          description:
            "HomeUP's transparent 4-step process for selling your Singapore property at a fixed fee.",
          steps: SELL_HOW_TO_STEPS,
        }}
        service={{
          name: "HomeUP Property Selling Services Singapore",
          description: config.meta.description,
          path: "/sell",
          offers: [
            {
              name: "HDB Selling Package",
              price: "1999",
              description: "Full HDB resale service at a fixed fee of $1,999 + GST.",
            },
            {
              name: "Condo/EC Selling Package",
              price: "4999",
              description: "Full condo resale service at a fixed fee of $4,999 + GST.",
            },
            {
              name: "Landed Selling Package",
              price: "9999",
              description: "Full landed resale service at a fixed fee of $9,999 + GST.",
            },
          ],
        }}
      />
      <Navbar />
      <main>
        <SellLandingContent config={config} listingCount={stats.total} />
      </main>
      <Footer />
    </>
  );
}
