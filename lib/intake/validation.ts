import { z } from "zod";
import { MAX_PHOTOS, MIN_PHOTOS } from "./storage";

const sgPhoneRegex = /^(\+65|65)?[689]\d{7}$/;

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null || String(v).trim() === "" ? null : String(v).trim()));

const listingTypeEnum = z.enum(
  ["hdb_room", "hdb_whole", "condo_room", "condo_whole", "other"],
  { message: "Select what you're renting out" },
);

/** Client-side schema (no transforms) for react-hook-form */
export const intakeClientFormSchema = z.object({
  landlord_name: z.string().trim().min(1, "Name is required"),
  landlord_phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .refine(
      (v) => sgPhoneRegex.test(v.replace(/[\s-]/g, "")),
      "Enter a valid Singapore phone number",
    ),
  landlord_email: z.string().trim().optional(),
  listing_type: listingTypeEnum,
  district: z.string().trim().min(1, "District is required"),
  rent_monthly: z.coerce.number().positive("Monthly rent must be greater than 0"),
  bedrooms: z.coerce.number().int().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.coerce.number().int().min(1, "At least 1 bathroom is required"),
  sqft: z.coerce.number().int().positive().optional().or(z.literal("")),
  mrt_distance: z.string().trim().optional(),
  furnishing: z.enum(["unfurnished", "partial", "fully"]).optional(),
  availability_date: z.string().trim().optional(),
  selling_points: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type IntakeFormInput = z.infer<typeof intakeClientFormSchema>;

/** Server-side schema (includes attribution + output transforms) */
export const intakeFormSchema = z.object({
  landlord_name: z.string().trim().min(1, "Name is required"),
  landlord_phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => sgPhoneRegex.test(v), "Enter a valid Singapore phone number"),
  landlord_email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" || v == null ? undefined : v))
    .pipe(z.string().email("Enter a valid email").optional()),
  listing_type: listingTypeEnum,
  district: z.string().trim().min(1, "District is required"),
  rent_monthly: z.coerce.number().positive("Monthly rent must be greater than 0"),
  bedrooms: z.coerce.number().int().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.coerce.number().int().min(1, "At least 1 bathroom is required"),
  sqft: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  mrt_distance: optionalString,
  furnishing: z
    .union([
      z.enum(["unfurnished", "partial", "fully"]),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  availability_date: optionalString,
  selling_points: z
    .string()
    .optional()
    .transform((v) => {
      if (!v?.trim()) return [];
      return v
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 3);
    }),
  notes: optionalString,
  source_variant: optionalString,
  utm_source: optionalString,
  utm_medium: optionalString,
  utm_campaign: optionalString,
  utm_content: optionalString,
});

export type IntakeFormValues = z.output<typeof intakeFormSchema>;

export function validatePhotoCount(count: number): string | null {
  if (count < MIN_PHOTOS) return `Upload at least ${MIN_PHOTOS} photos`;
  if (count > MAX_PHOTOS) return `Maximum ${MAX_PHOTOS} photos allowed`;
  return null;
}

export function formDataToIntakePayload(
  data: IntakeFormValues,
  photoUrls: string[],
) {
  return {
    landlord_name: data.landlord_name,
    landlord_phone: data.landlord_phone,
    landlord_email: data.landlord_email ?? null,
    listing_type: data.listing_type,
    district: data.district,
    address_line: null,
    rent_monthly: data.rent_monthly,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    sqft: data.sqft,
    mrt_distance: data.mrt_distance ?? null,
    furnishing: data.furnishing ?? null,
    availability_date: data.availability_date ?? null,
    selling_points: data.selling_points,
    notes: data.notes,
    photo_urls: photoUrls,
    status: "landlord_submitted" as const,
    source_variant: data.source_variant ?? null,
    utm_source: data.utm_source ?? null,
    utm_medium: data.utm_medium ?? null,
    utm_campaign: data.utm_campaign ?? null,
    utm_content: data.utm_content ?? null,
  };
}
