"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { HomeUpLogo } from "@/components/ui/HomeUpLogo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/listings/pg-sources", label: "PG Sync" },
  { href: "/admin/listings?tab=playbook", label: "Playbook" },
  { href: "/admin/listings?tab=analytics", label: "Analytics" },
];

function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.href === "/admin/listings?tab=playbook") {
      return pathname === "/admin/listings" && tab === "playbook";
    }
    if (item.href === "/admin/listings?tab=analytics") {
      return pathname === "/admin/listings" && tab === "analytics";
    }
    if (item.href === "/admin/listings") {
      return (
        (pathname === "/admin/listings" && !tab) ||
        pathname.startsWith("/admin/listings/new") ||
        pathname.startsWith("/admin/listings/edit")
      );
    }
    return pathname.startsWith(item.href);
  }

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item)
              ? "bg-primary-50 text-primary-700"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/admin/listings" className="flex items-center gap-2">
              <HomeUpLogo variant="wordmark" className="h-7 w-auto" />
              <span className="text-sm font-medium text-neutral-500">Admin</span>
            </Link>
            <Suspense fallback={<nav className="flex items-center gap-1" />}>
              <AdminNav />
            </Suspense>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
