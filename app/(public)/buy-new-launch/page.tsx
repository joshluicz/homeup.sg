import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPageJsonLd } from "@/components/seo/LandingPageJsonLd";
import { BuyLandingContent } from "@/components/sections/BuyLandingContent";
import { BUY_PAGE_NEW_LAUNCH } from "@/lib/data/buy-pages";
import { BUY_FAQ_NEW_LAUNCH } from "@/lib/data/faqs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BUY_HOW_TO_STEPS } from "@/lib/seo/schema";

const config = BUY_PAGE_NEW_LAUNCH;

export const metadata = buildPageMetadata({
  title: config.meta.title,
  description: config.meta.description,
  path: "/buy-new-launch",
});

export default function BuyNewLaunchPage() {
  return (
    <>
      <LandingPageJsonLd
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Buy", path: "/buy" },
          { name: "Buy New Launch", path: "/buy-new-launch" },
        ]}
        faq={BUY_FAQ_NEW_LAUNCH}
        howTo={{
          name: "How to buy a new launch property with HomeUP",
          description:
            "Independent new launch buying guidance from project comparison through to OTP and progressive payment.",
          steps: BUY_HOW_TO_STEPS,
        }}
        service={{
          name: "HomeUP New Launch Buying Services",
          description: config.meta.description,
          path: "/buy-new-launch",
          offers: [
            {
              name: "New Launch Purchase Representation",
              price: "0",
              description: "Complimentary buyer representation for new launch purchases.",
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
