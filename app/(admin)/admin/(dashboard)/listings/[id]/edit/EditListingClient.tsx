"use client";

import { useEffect } from "react";
import { ListingForm } from "@/components/admin/ListingForm";
import type { ListingFormData } from "@/lib/listings/types";

type EditListingClientProps = {
  listingId: string;
  initialData: ListingFormData;
  showSavedBanner?: boolean;
};

export function EditListingClient({
  listingId,
  initialData,
  showSavedBanner,
}: EditListingClientProps) {
  useEffect(() => {
    if (showSavedBanner) {
      window.history.replaceState({}, "", `/admin/listings/${listingId}/edit`);
    }
  }, [showSavedBanner, listingId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Edit Listing</h1>
        <p className="text-sm text-neutral-600">{initialData.title}</p>
      </div>
      <ListingForm
        listingId={listingId}
        initialData={initialData}
        mode="edit"
        initialSaved={showSavedBanner}
      />
    </div>
  );
}
