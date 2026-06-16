import type { Metadata } from "next";
import Script from "next/script";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppFloat } from "@/components/ui/WhatsAppFloat";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { websiteSchema } from "@/lib/seo/schema";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const BASE_URL = "https://lp.homeup.sg";
const OG_IMAGE = `${BASE_URL}/images/team-group.png`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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
      "Sell your Singapore home for more. HomeUP charges a flat fixed fee: HDB from $1,999, Condo from $4,999. 1,000+ transactions closed. 5 CEA-licensed agents.",
    images: [
      {
        url: OG_IMAGE,
        width: 920,
        height: 614,
        alt: "The HomeUP team, 5 CEA-licensed property agents in Singapore",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());
              gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `}</Script>
          </>
        )}
        <JsonLd data={websiteSchema()} />
        <AnalyticsProvider />
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
