import { Suspense } from "react";
import { ArticleAnalyticsDashboard } from "@/components/admin/ArticleAnalyticsDashboard";

export const metadata = { title: "Article Analytics — HomeUp Admin" };

export default function ArticleAnalyticsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-400">Loading analytics…</div>}>
      <ArticleAnalyticsDashboard />
    </Suspense>
  );
}
