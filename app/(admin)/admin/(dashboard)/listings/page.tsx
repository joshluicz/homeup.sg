import { Suspense } from "react";
import { ListingsIndexClient } from "@/components/admin/ListingsIndexClient";
import { PlaybookTab } from "@/components/admin/PlaybookTab";

export default async function ListingsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  if (tab === "playbook") {
    return <PlaybookTab />;
  }

  return (
    <Suspense>
      <ListingsIndexClient />
    </Suspense>
  );
}
