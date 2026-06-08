"use client";

import { useMemo } from "react";
import { ListingForm } from "@/components/admin/ListingForm";

export default function NewListingPage() {
  const listingId = useMemo(() => crypto.randomUUID(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">New Listing</h1>
        <p className="text-sm text-neutral-600">Create a new property listing</p>
      </div>
      <ListingForm listingId={listingId} mode="create" />
    </div>
  );
}
