import type { Metadata, Viewport } from "next";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeUp Media",
  description: "Upload and manage property media content",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="flex min-h-full flex-col">
        {user && <AppNav email={user.email ?? "Signed in"} />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
