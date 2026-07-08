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
      <body>
        {user && <AppNav email={user.email ?? "Signed in"} />}
        <main>{children}</main>
      </body>
    </html>
  );
}
