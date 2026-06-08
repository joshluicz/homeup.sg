import type { ListingFormData } from "./types";

export function validateListingForm(data: Partial<ListingFormData>): string | null {
  if (!data.title?.trim()) return "Title is required";
  if (!data.slug?.trim()) return "Slug is required";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    return "Slug must be lowercase letters, numbers, and hyphens only";
  }
  if (!data.listed_as) return "Listed as is required";
  if (data.price == null || data.price <= 0) return "Price is required";
  if (data.area_sqft == null || data.area_sqft <= 0) return "Area (sqft) is required";
  if (!data.flat_type) return "Flat type is required";
  return null;
}

export function formDataToDbPayload(data: ListingFormData, status: "active" | "draft") {
  return {
    title: data.title.trim(),
    slug: data.slug.trim(),
    status,
    listed_as: data.listed_as,
    is_sold: data.is_sold,
    is_featured: data.is_featured,
    price: data.price,
    negotiable: data.negotiable,
    area_sqft: data.area_sqft,
    flat_type: data.flat_type,
    condition: data.condition,
    rooms: data.rooms,
    bathrooms: data.bathrooms,
    tenure: data.is_freehold ? null : data.tenure,
    is_freehold: data.is_freehold,
    address_line_1: data.address_line_1?.trim() || null,
    featured_image_url: data.featured_image_url,
    image_urls: data.image_urls,
  };
}
