import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPageJsonLd } from "@/components/seo/LandingPageJsonLd";
import { BuyLandingContent } from "@/components/sections/BuyLandingContent";
import { BUY_PAGE_HDB } from "@/lib/data/buy-pages";
import { BUY_FAQ_HDB } from "@/lib/data/faqs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BUY_HOW_TO_STEPS } from "@/lib/seo/schema";

const config = BUY_PAGE_HDB;

export const metadata = buildPageMetadata({
  title: config.meta.title,
  description: config.meta.description,
  path: "/buy-hdb",
});

export default function BuyHdbPage() {
  return (
    <>
      <LandingPageJsonLd
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Buy", path: "/buy" },
          { name: "Buy HDB", path: "/buy-hdb" },
        ]}
        faq={BUY_FAQ_HDB}
        howTo={{
          name: "How to buy an HDB resale flat with HomeUP",
          description:
            "Structured HDB buying guidance from grants and financing through to OTP and completion.",
          steps: BUY_HOW_TO_STEPS,
        }}
        service={{
          name: "HomeUP HDB Buying Services",
          description: config.meta.description,
          path: "/buy-hdb",
          offers: [
            {
              name: "HDB Purchase Representation",
              price: "1999",
              description: "Fixed-fee buyer representation for HDB resale purchases.",
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
