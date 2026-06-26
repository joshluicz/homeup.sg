"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingsIndexClient } from "@/components/admin/ListingsIndexClient";
import { PlaybookTab } from "@/components/admin/PlaybookTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab");

  useEffect(() => {
    if (tab === "agent-videos") {
      router.replace("/admin/agent-profiles");
    }
  }, [router, tab]);

  if (tab === "agent-videos") return null;
  if (tab === "playbook") {
    const view = searchParams.get("view") === "videos" ? "videos" : "articles";
    return <PlaybookTab mode={view === "videos" ? "video" : "article"} key={view} />;
  }
  if (tab === "analytics") return <AnalyticsTab />;
  return <ListingsIndexClient />;
}

export function ListingsPageClient() {
  return (
    <Suspense>
      <ListingsContent />
    </Suspense>
  );
}
