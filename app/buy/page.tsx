import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BuyPricing } from "@/components/sections/BuyPricing";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const WHATSAPP = "https://wa.me/6580877015";

export const metadata: Metadata = {
  title: "Buying Services | HomeUP",
  description:
    "Buy your next home with confidence. HomeUP's dedicated buying team helps you navigate HDB, resale condo and new launch purchases with clear strategy and transparent fees.",
};

const heroPoints = [
  "Understand your affordability and financing options",
  "Compare HDB, resale condo and new launch opportunities",
  "Identify strong lifestyle and investment potential",
  "Negotiate and secure the right property at the right price",
  "Plan your timeline if you need to sell your existing home",
];

export default function BuyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* Hero */}
        <section aria-label="Buying with HomeUP" className="bg-white">
          <div className="mx-auto w-full max-w-[1200px] px-8 py-14 sm:px-12 lg:py-20 xl:px-20">
            <div className="max-w-3xl">
              <Eyebrow>Buying With HomeUP</Eyebrow>
              <h1
                className="font-display font-extrabold leading-[1.06] tracking-tight text-neutral-900"
                style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
              >
                Know what you&apos;re buying<br />
                <span className="text-primary-600">before you make your move</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-normal leading-relaxed text-neutral-600">
                Whether you&apos;re purchasing your first HDB, upgrading to a resale condo,
                exploring new launches, or right-sizing to a more suitable home, the right
                buying strategy saves you time, money and costly mistakes. Our dedicated
                buying team — led by Tong Boon, one of his agency&apos;s top private residential
                buying transactors — guides clients through every stage with confidence.
              </p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {heroPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm font-normal text-neutral-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button size="lg" asChild>
                  <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <WhatsAppIcon className="h-5 w-5 shrink-0" />
                    Book a Complimentary Consultation
                  </a>
                </Button>
                <p className="mt-2 text-sm font-normal text-neutral-400">
                  No commitment · Build a clear roadmap for your next move
                </p>
              </div>
            </div>
          </div>
        </section>

        <BuyPricing />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
