import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listingToFormData } from "@/lib/listings/utils";
import { EditListingClient } from "./EditListingClient";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditListingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { saved } = await searchParams;

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!listing) notFound();

  return (
    <EditListingClient
      listingId={listing.id}
      initialData={listingToFormData(listing)}
      showSavedBanner={saved === "1"}
    />
  );
}
