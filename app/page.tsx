import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AgentProfiles } from "@/components/sections/AgentProfiles";
import { BuyCta } from "@/components/sections/BuyCta";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Hero } from "@/components/sections/Hero";
import { PropertyListings } from "@/components/sections/PropertyListings";
import { SocialPanel } from "@/components/sections/SocialPanel";
import { Testimonials } from "@/components/sections/Testimonials";
import PricingSection4 from "@/components/ui/pricing-section-4";

export const metadata: Metadata = {
  alternates: { canonical: "https://lp.homeup.sg" },
  openGraph: { url: "https://lp.homeup.sg" },
};

// ── JSON-LD schemas ──────────────────────────────────────────────────────────

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "RealEstateAgent"],
  "@id": "https://lp.homeup.sg/#organization",
  name: "HomeUP",
  alternateName: "HOMEUP",
  url: "https://lp.homeup.sg",
  logo: {
    "@type": "ImageObject",
    url: "https://lp.homeup.sg/images/homeup-logo-wordmark.png",
  },
  description:
    "HomeUP is a Singapore fixed-fee property agency offering full-service property sales and purchases at a transparent flat fee. HDB sellers from $1,999, Condo/EC from $4,999, Landed from $9,999. Over 1,000 transactions closed by 5 CEA-licensed agents under C & H Properties (CEA L3007139C).",
  areaServed: { "@type": "Country", name: "Singapore" },
  telephone: "+6580877015",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+6580877015",
    contactType: "customer service",
    availableLanguage: ["English"],
  },
  sameAs: [
    "https://www.instagram.com/homeup_singapore",
    "https://www.tiktok.com/@homeup.sg",
    "https://www.facebook.com/share/1GmU7rZQfK/",
    "https://youtube.com/@homeupdennis",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    reviewCount: "4",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Ernest Lim" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "The team led by Dennis has done a wonderful job in selling my house. Their professionalism, friendliness, and efficiency made selling my house a wonderful experience.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Terrence Koh" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "If I can give more than 5 stars, I will unreservedly do so. Tong Boon provided top notch agency service for the sale of my condo. His commitment towards meeting the best interests of the seller is exceptional.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Mark Kwok Leong" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Highly recommend Kenji for his professional and honest service. He helped us secure a buyer for my dad's HDB flat quickly at a price higher than the last transacted price.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Kwok Yung" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Second time engaging Dennis and Kenji to sell my property and it has been as smooth as the first time. Great work and excellent value for money.",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does HomeUP charge to sell my property?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HomeUP charges a transparent fixed fee: $1,999 for HDB flats, $4,999 for Condo/EC, and $9,999 for Landed properties. This covers the full sales process — listing on PropertyGuru, SRX and 99.co, viewings, negotiation, and documentation — with no hidden charges.",
      },
    },
    {
      "@type": "Question",
      name: "What is a fixed-fee property agent in Singapore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A fixed-fee property agent charges a set flat fee rather than a percentage commission. HomeUP charges $1,999–$9,999 depending on property type, compared to the typical 1–2% agent commission, which can amount to $10,000–$70,000 or more on a Singapore property sale.",
      },
    },
    {
      "@type": "Question",
      name: "Are HomeUP agents CEA licensed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All HomeUP agents are CEA-licensed property agents operating under C & H Properties (CEA licence L3007139C). The team has closed over 1,000 transactions totalling more than $200 million in real estate value across HDB, condo, and landed properties.",
      },
    },
    {
      "@type": "Question",
      name: "How many transactions has HomeUP closed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HomeUP has closed over 1,000 property transactions, including more than 860 HDB transactions and over 260 condo and landed transactions, totalling more than $200 million in Singapore real estate value transacted.",
      },
    },
    {
      "@type": "Question",
      name: "Does HomeUP help with buying property in Singapore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. HomeUP provides complimentary buyer representation for resale condo and landed property purchases. For HDB purchases, a fixed fee of $1,999 applies. Services include financing guidance, market analysis, unit shortlisting, negotiation support, and documentation.",
      },
    },
    {
      "@type": "Question",
      name: "Which property portals does HomeUP list on?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HomeUP lists properties on Singapore's major property portals — PropertyGuru, SRX, and 99.co — as part of the fixed-fee package, ensuring maximum buyer visibility for your property.",
      },
    },
  ],
};

// ── Page ─────────────────────────────────────────────────────────────────────

function GreenDivider() {
  return (
    <div
      aria-hidden="true"
      className="h-16 bg-gradient-to-b from-primary-50/60 to-white"
    />
  );
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main>
        <Hero />
        <PricingSection4 />
        <GreenDivider />
        <Testimonials />
        <GreenDivider />
        <PropertyListings />
        <GreenDivider />
        <BuyCta />
        <GreenDivider />
        <AgentProfiles />
        <SocialPanel />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
