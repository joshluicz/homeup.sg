"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ListingForm } from "@/components/admin/ListingForm";
import { listingToFormData } from "@/lib/listings/utils";
import { Loader2 } from "lucide-react";

export function EditListingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("id");
  const showSavedBanner = searchParams.get("saved") === "1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [initialData, setInitialData] = useState<
    ReturnType<typeof listingToFormData> | null
  >(null);

  useEffect(() => {
    if (showSavedBanner && listingId) {
      window.history.replaceState({}, "", `/admin/listings/edit?id=${listingId}`);
    }
  }, [showSavedBanner, listingId]);

  useEffect(() => {
    if (!listingId) {
      setError("Missing listing id");
      setLoading(false);
      return;
    }

    async function loadListing() {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: listing, error: dbError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .is("deleted_at", null)
        .single();

      if (dbError || !listing) {
        setError("Listing not found");
        setLoading(false);
        return;
      }

      setTitle(listing.title);
      setInitialData(listingToFormData(listing));
      setLoading(false);
    }

    void loadListing();
  }, [listingId, router]);

  if (!listingId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Missing listing id.{" "}
        <button
          type="button"
          className="font-medium underline"
          onClick={() => router.push("/admin/listings")}
        >
          Back to listings
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error ?? "Listing not found"}.{" "}
        <button
          type="button"
          className="font-medium underline"
          onClick={() => router.push("/admin/listings")}
        >
          Back to listings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Edit Listing</h1>
        <p className="text-sm text-neutral-600">{title}</p>
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
