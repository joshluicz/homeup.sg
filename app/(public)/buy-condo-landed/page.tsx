import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPageJsonLd } from "@/components/seo/LandingPageJsonLd";
import { BuyLandingContent } from "@/components/sections/BuyLandingContent";
import { BUY_PAGE_CONDO_LANDED } from "@/lib/data/buy-pages";
import { BUY_FAQ_CONDO } from "@/lib/data/faqs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BUY_HOW_TO_STEPS } from "@/lib/seo/schema";

const config = BUY_PAGE_CONDO_LANDED;

export const metadata = buildPageMetadata({
  title: config.meta.title,
  description: config.meta.description,
  path: "/buy-condo-landed",
});

export default function BuyCondoLandedPage() {
  return (
    <>
      <LandingPageJsonLd
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Buy", path: "/buy" },
          { name: "Buy Condo/Landed", path: "/buy-condo-landed" },
        ]}
        faq={BUY_FAQ_CONDO}
        howTo={{
          name: "How to buy resale condo or landed property with HomeUP",
          description:
            "Complimentary buyer representation for resale private property purchases in Singapore.",
          steps: BUY_HOW_TO_STEPS,
        }}
        service={{
          name: "HomeUP Condo and Landed Buying Services",
          description: config.meta.description,
          path: "/buy-condo-landed",
          offers: [
            {
              name: "Condo/Landed Purchase Representation",
              price: "0",
              description: "Complimentary buyer representation for resale private property.",
            },
          ],
        }}
      />
      <Navbar />
      <main className="bg-white">
        <BuyLandingContent config={config} />
      </main>
      <Footer />
    </>
  );
}
