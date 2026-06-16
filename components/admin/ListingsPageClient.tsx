"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ListingsIndexClient } from "@/components/admin/ListingsIndexClient";
import { PlaybookTab } from "@/components/admin/PlaybookTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";

function ListingsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  if (tab === "playbook") return <PlaybookTab />;
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
