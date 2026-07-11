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
  { href: "/admin/listings/pg-sources", label: "Listings Sync" },
  { href: "/admin/listings?tab=playbook&view=articles", label: "Articles" },
  { href: "/admin/article-generation", label: "Article Generation" },
  { href: "/admin/article-analytics", label: "Article Analytics" },
  { href: "/playbook", label: "Playbook" },
  { href: "/admin/transactions", label: "Transaction Data" },
  { href: "/admin/agent-profiles", label: "Agent Videos" },
  { href: "/admin/listings?tab=analytics", label: "Analytics" },
  { href: "/admin/sync-kit-handoff", label: "Sync Kit Guide" },
];

function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.href === "/admin/listings?tab=playbook&view=articles") {
      return pathname === "/admin/listings" && tab === "playbook" && searchParams.get("view") !== "videos";
    }
    if (item.href === "/admin/listings?tab=playbook&view=videos") {
      return pathname === "/admin/listings" && tab === "playbook" && searchParams.get("view") === "videos";
    }
    if (item.href === "/admin/listings?tab=analytics") {
      return pathname === "/admin/listings" && tab === "analytics";
    }
    if (item.href === "/admin/agent-profiles") {
      return pathname.startsWith("/admin/agent-profiles");
    }
    if (item.href === "/playbook") {
      return pathname.startsWith("/playbook");
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
    <nav className="flex items-center gap-0.5 pb-2">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm",
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href="/admin/listings" className="flex items-center gap-2">
              <HomeUpLogo variant="wordmark" className="h-6 w-auto sm:h-7" />
              <span className="text-sm font-medium text-neutral-500">Admin</span>
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
          <div className="overflow-x-auto pb-1">
            <Suspense fallback={<nav className="flex items-center gap-1" />}>
              <AdminNav />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
