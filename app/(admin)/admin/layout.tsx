import { JetBrains_Mono } from "next/font/google";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={jetbrains.variable}>{children}</div>;
}
