"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ListingsIndexClient } from "@/components/admin/ListingsIndexClient";
import { PlaybookTab } from "@/components/admin/PlaybookTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";

function ListingsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
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
