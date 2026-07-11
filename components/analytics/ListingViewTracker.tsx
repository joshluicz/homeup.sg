"use client";

import { useEffect, useRef } from "react";
import { trackListingView } from "@/lib/analytics";

export function ListingViewTracker({
  slug,
  listingType,
  price,
}: {
  slug: string;
  listingType: string;
  price?: number;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackListingView(slug, listingType, price);
  }, [slug, listingType, price]);

  return null;
}
