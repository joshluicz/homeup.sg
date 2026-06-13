import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPageJsonLd } from "@/components/seo/LandingPageJsonLd";
import { SellLandingContent } from "@/components/sections/SellLandingContent";
import { SELL_FAQ_LANDED } from "@/lib/data/faqs";
import { SELL_PAGE_LANDED } from "@/lib/data/sell-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SELL_HOW_TO_STEPS } from "@/lib/seo/schema";

const config = SELL_PAGE_LANDED;

export const metadata = buildPageMetadata({
  title: config.meta.title,
  description: config.meta.description,
  path: "/sell-landed",
});

export default function SellLandedPage() {
  return (
    <>
      <LandingPageJsonLd
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Sell", path: "/sell" },
          { name: "Sell Landed", path: "/sell-landed" },
        ]}
        faq={SELL_FAQ_LANDED}
        howTo={{
          name: "How to sell your landed home with HomeUP",
          description:
            "HomeUP's fixed-fee landed resale process with targeted marketing and patient negotiation.",
          steps: SELL_HOW_TO_STEPS,
        }}
        service={{
          name: "HomeUP Landed Selling Services",
          description: config.meta.description,
          path: "/sell-landed",
          offers: [
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
        <SellLandingContent config={config} />
      </main>
      <Footer />
    </>
  );
}
