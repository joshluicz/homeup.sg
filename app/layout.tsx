import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppFloat } from "@/components/ui/WhatsAppFloat";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/constants";
import { WebMCPProvider } from "@/components/ai/WebMCPProvider";
import { CRITICAL_CSS } from "@/lib/critical-css";
import { OG_IMAGE, SITE_URL } from "@/lib/seo/constants";
import { websiteSchema } from "@/lib/seo/schema";
import "./globals.css";

const GA_ID = GA_MEASUREMENT_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fixed-Fee Property Agents Singapore | HomeUP",
    template: "%s | HomeUP",
  },
  description:
    "HomeUP helps Singapore homeowners sell for more with a transparent fixed fee: HDB from $1,999, Condo from $4,999. 1,000+ transactions closed by CEA-licensed agents.",
  keywords: [
    "fixed fee property agent Singapore",
    "sell HDB Singapore",
    "property commission Singapore",
    "fixed commission agent",
    "HomeUP Singapore",
  ],
  openGraph: {
    type: "website",
    locale: "en_SG",
    siteName: "HomeUP",
    title: "Fixed-Fee Property Agents Singapore | HomeUP",
    description:
      "Sell your Singapore home for more. HomeUP charges a flat fixed fee: HDB from $1,999, Condo from $4,999. 1,000+ transactions closed. 6 CEA-licensed agents.",
    images: [
      {
        url: OG_IMAGE,
        width: 920,
        height: 614,
        alt: "The HomeUP team, 6 CEA-licensed property agents in Singapore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fixed-Fee Property Agents Singapore | HomeUP",
    description:
      "Sell your Singapore home for more. Fixed fee from $1,999. 1,000+ transactions closed.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        <style id="critical-css" dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        {SUPABASE_URL && (
          <>
            <link rel="preconnect" href={SUPABASE_URL} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={SUPABASE_URL} />
          </>
        )}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body>
        <LoadingScreen />
        {GA_ID && (
          <Script id="ga4-loader" strategy="lazyOnload">{`
            try {
              if (localStorage.getItem('homeup-internal') === '1') {
                window['ga-disable-${GA_ID}'] = true;
              }
            } catch (e) {}
            (function () {
              var script = document.createElement('script');
              script.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
              script.async = true;
              document.head.appendChild(script);
              script.onload = function () {
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              };
            })();
          `}</Script>
        )}
        <JsonLd data={websiteSchema()} />
        <AnalyticsProvider />
        <WebMCPProvider />
        {children}
        <ScrollToTopButton />
        <WhatsAppFloat />
        <Analytics />
      </body>
    </html>
  );
}
