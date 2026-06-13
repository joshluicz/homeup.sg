import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPageJsonLd } from "@/components/seo/LandingPageJsonLd";
import { BuyLandingContent } from "@/components/sections/BuyLandingContent";
import { BUY_PAGE_GENERAL } from "@/lib/data/buy-pages";
import { BUY_FAQ_GENERAL } from "@/lib/data/faqs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BUY_HOW_TO_STEPS } from "@/lib/seo/schema";

const config = BUY_PAGE_GENERAL;

export const metadata = buildPageMetadata({
  title: config.meta.title,
  description: config.meta.description,
  path: "/buy",
  ogImage: "https://lp.homeup.sg/images/agent-tong-boon.png",
  ogImageAlt: "Yeo Tong Boon — HomeUP Senior Property Advisor",
  ogImageWidth: 400,
  ogImageHeight: 400,
});

export default function BuyPage() {
  return (
    <>
      <LandingPageJsonLd
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Buy", path: "/buy" },
        ]}
        faq={BUY_FAQ_GENERAL}
        howTo={{
          name: "How to buy property with HomeUP",
          description:
            "HomeUP's structured buying process for HDB, condo, landed, and new launch purchases in Singapore.",
          steps: BUY_HOW_TO_STEPS,
        }}
        service={{
          name: "HomeUP Property Buying Services Singapore",
          description: config.meta.description,
          path: "/buy",
          offers: [
            {
              name: "HDB Purchase Representation",
              price: "1999",
              description:
                "Full guidance through CPF grants, financing, and the HDB resale process.",
            },
            {
              name: "Condo/Landed Purchase Representation",
              price: "0",
              description:
                "Complimentary buyer representation for resale condo and landed purchases.",
            },
            {
              name: "New Launch Purchase Representation",
              price: "0",
              description:
                "Complimentary assistance to purchase New Launch straight from developers.",
            },
          ],
        }}
      />
      <Navbar />
      <main className="bg-white">
        <BuyLandingContent config={config} showAwardsStrip />
      </main>
      <Footer />
    </>
  );
}
