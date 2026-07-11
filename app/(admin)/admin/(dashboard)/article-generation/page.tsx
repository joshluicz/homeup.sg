import { Suspense } from "react";
import { ArticleGenerationTab } from "@/components/admin/ArticleGenerationTab";

export const metadata = { title: "Article Generation — HomeUp Admin" };

export default function ArticleGenerationPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-400">Loading…</div>}>
      <ArticleGenerationTab />
    </Suspense>
  );
}
