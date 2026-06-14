import { Suspense } from "react";
import { ListingsIndexClient } from "@/components/admin/ListingsIndexClient";

export default function ListingsIndexPage() {
  return (
    <Suspense>
      <ListingsIndexClient />
    </Suspense>
  );
}
