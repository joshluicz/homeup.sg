import type { ListingFormData } from "./listing-types.ts";
import { generateSlug } from "./utils.ts";
import type { PropertyGuruExtraction } from "./types.ts";

type MapInput = {
  extraction: PropertyGuruExtraction;
  featured_image_url: string | null;
  image_urls: string[];
  uploadWarnings: string[];
  extractedImageCount?: number;
};

export function mapToFormData(input: MapInput): {
  data: Partial<ListingFormData>;
  warnings: string[];
} {
  const { extraction, featured_image_url, image_urls, uploadWarnings, extractedImageCount = 0 } = input;
  const warnings = [...uploadWarnings];

  const title = extraction.title ?? "";
  const price = extraction.price ?? 0;
  const area_sqft = extraction.area_sqft ?? 0;

  if (!title) {
    warnings.push("Title could not be extracted — please enter manually.");
  }
  if (!price || price <= 0) {
    warnings.push("Price could not be extracted — please enter manually.");
  }
  if (!area_sqft || area_sqft <= 0) {
    warnings.push("Area (sqft) could not be extracted — please enter manually.");
  }
  if (!featured_image_url && image_urls.length === 0) {
    if (extractedImageCount === 0) {
      warnings.push(
        "No images found in pasted content — upload manually in the Media section.",
      );
    } else {
      warnings.push("No images were imported — upload manually in the Media section.");
    }
  }

  const data: Partial<ListingFormData> = {
    title,
    slug: title ? generateSlug(title) : "",
    status: "active",
    listed_as: extraction.listed_as ?? "sell",
    is_sold: false,
    is_featured: false,
    price,
    negotiable: extraction.negotiable ?? "negotiable",
    area_sqft,
    flat_type: extraction.flat_type ?? "condominium",
    condition: extraction.condition ?? "no_furnishing",
    rooms: extraction.rooms ?? null,
    bathrooms: extraction.bathrooms ?? null,
    tenure: extraction.is_freehold ? null : (extraction.tenure ?? null),
    is_freehold: extraction.is_freehold ?? false,
    address_line_1: extraction.address_line_1 ?? "",
    featured_image_url,
    image_urls,
  };

  return { data, warnings };
}
