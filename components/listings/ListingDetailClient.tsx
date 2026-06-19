"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ListingDetailContent } from "@/components/listings/ListingDetailContent";
import { ListingDetailNotFound } from "@/components/listings/ListingDetailNotFound";
import type { Listing } from "@/lib/listings/types";
import { getListingBySlug, getRelatedListings } from "@/lib/listings/queries";
import { resolveListingSlug } from "@/lib/listings/slug-from-path";

type ListingDetailClientProps = {
  slug: string;
};

/** Client shell for static-export fallback routes (see slug-from-path). */
export function ListingDetailClient({ slug }: ListingDetailClientProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [related, setRelated] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolvedSlug = resolveListingSlug(slug);
    if (!resolvedSlug) {
      setListing(null);
      setRelated([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getListingBySlug(resolvedSlug)
      .then(async (data) => {
        setListing(data);
        if (data) {
          const relatedListings = await getRelatedListings(data.flat_type, data.slug);
          setRelated(relatedListings);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!listing) {
    return <ListingDetailNotFound />;
  }

  return <ListingDetailContent listing={listing} related={related} />;
}
