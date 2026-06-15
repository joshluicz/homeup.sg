import type { Listing, ListingFormData } from "./types";

const SQFT_TO_SQM = 0.0929;

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function computePricePsf(price: number, areaSqft: number): number | null {
  if (!price || !areaSqft || areaSqft <= 0) return null;
  return Math.round((price / areaSqft) * 100) / 100;
}

export function computeAreaSqm(areaSqft: number): number | null {
  if (!areaSqft || areaSqft <= 0) return null;
  return Math.round(areaSqft * SQFT_TO_SQM * 100) / 100;
}

export function formatSGD(amount: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

import { SITE_URL } from "@/lib/seo/constants";

export function getPublicListingUrl(slug: string): string {
  return `${SITE_URL}/listings/${slug}`;
}

export function getPublicListingPath(slug: string): string {
  return `/listings/${slug}`;
}

export function listingToFormData(listing: Listing): ListingFormData {
  return {
    title: listing.title,
    slug: listing.slug,
    status: listing.status === "archived" ? "draft" : listing.status,
    listed_as: listing.listed_as,
    is_sold: listing.is_sold,
    is_featured: listing.is_featured,
    price: listing.price,
    negotiable: listing.negotiable,
    area_sqft: listing.area_sqft,
    flat_type: listing.flat_type,
    condition: listing.condition,
    rooms: listing.rooms,
    bathrooms: listing.bathrooms,
    tenure: listing.tenure,
    is_freehold: listing.is_freehold,
    address_line_1: listing.address_line_1 ?? "",
    featured_image_url: listing.featured_image_url,
    image_urls: listing.image_urls ?? [],
  };
}

export const FLAT_TYPE_LABELS: Record<string, string> = {
  condominium: "Condominium",
  hdb: "HDB",
  landed: "Landed",
  apartment: "Apartment",
};

export const CONDITION_LABELS: Record<string, string> = {
  no_furnishing: "No Furnishing",
  partial: "Partial Furnishing",
  fully_furnished: "Fully Furnished",
};

export const NEGOTIABLE_LABELS: Record<string, string> = {
  negotiable: "Negotiable",
  starting_from: "Starting From",
};
