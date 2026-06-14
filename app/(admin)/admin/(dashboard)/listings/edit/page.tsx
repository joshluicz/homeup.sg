import { Suspense } from "react";
import { EditListingPageClient } from "@/components/admin/EditListingPageClient";

export default function EditListingPage() {
  return (
    <Suspense>
      <EditListingPageClient />
    </Suspense>
  );
}
