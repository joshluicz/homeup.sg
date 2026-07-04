import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyFormToken, hashClientIp, normalizePhone } from "@/lib/intake/form-token";
import { checkIntakeRateLimit, getClientIp } from "@/lib/intake/rate-limit";
import { uploadIntakePhotos, validatePhotoFile, MAX_PHOTOS } from "@/lib/intake/storage";
import {
  formDataToIntakePayload,
  intakeFormSchema,
  validatePhotoCount,
} from "@/lib/intake/validation";

export const runtime = "nodejs";

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Honeypot — bots fill hidden fields
    if (formValue(formData, "company_name").trim() !== "") {
      return NextResponse.json({ error: "Submission rejected" }, { status: 400 });
    }

    const formToken = formValue(formData, "form_token");
    const tokenCheck = verifyFormToken(formToken);
    if (!tokenCheck.ok) {
      return NextResponse.json({ error: tokenCheck.reason }, { status: 403 });
    }

    const photos = formData.getAll("photos").filter((f): f is File => f instanceof File);

    const photoCountError = validatePhotoCount(photos.length);
    if (photoCountError) {
      return NextResponse.json({ error: photoCountError }, { status: 400 });
    }

    for (const photo of photos) {
      const photoError = validatePhotoFile(photo);
      if (photoError) {
        return NextResponse.json({ error: photoError }, { status: 400 });
      }
    }

    if (photos.length > MAX_PHOTOS) {
      return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, { status: 400 });
    }

    const parsed = intakeFormSchema.safeParse({
      landlord_name: formValue(formData, "landlord_name"),
      landlord_phone: formValue(formData, "landlord_phone"),
      landlord_email: formValue(formData, "landlord_email"),
      listing_type: formValue(formData, "listing_type"),
      district: formValue(formData, "district"),
      rent_monthly: formValue(formData, "rent_monthly"),
      bedrooms: formValue(formData, "bedrooms"),
      bathrooms: formValue(formData, "bathrooms"),
      sqft: formValue(formData, "sqft"),
      mrt_distance: formValue(formData, "mrt_distance"),
      furnishing: formValue(formData, "furnishing"),
      availability_date: formValue(formData, "availability_date"),
      selling_points: formValue(formData, "selling_points"),
      notes: formValue(formData, "notes"),
      source_variant: formValue(formData, "source_variant") || null,
      utm_source: formValue(formData, "utm_source") || null,
      utm_medium: formValue(formData, "utm_medium") || null,
      utm_campaign: formValue(formData, "utm_campaign") || null,
      utm_content: formValue(formData, "utm_content") || null,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid form data";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const supabase = createServiceClient();
    const clientIp = getClientIp(request);
    const ipHash = clientIp ? hashClientIp(clientIp) : null;
    const normalizedPhone = normalizePhone(parsed.data.landlord_phone);

    const rateLimit = await checkIntakeRateLimit(supabase, ipHash, normalizedPhone);
    if (!rateLimit.allowed) {
      const headers: HeadersInit = {};
      if (rateLimit.retryAfterSeconds) {
        headers["Retry-After"] = String(rateLimit.retryAfterSeconds);
      }
      return NextResponse.json({ error: rateLimit.reason }, { status: 429, headers });
    }

    const { data: row, error: insertError } = await supabase
      .from("rental_intakes")
      .insert({
        ...formDataToIntakePayload(parsed.data, []),
        landlord_phone: normalizedPhone,
        photo_urls: [],
        client_ip_hash: ipHash,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to save intake" },
        { status: 500 },
      );
    }

    if (photos.length > 0) {
      let photoUrls: string[];
      try {
        photoUrls = await uploadIntakePhotos(supabase, row.id, photos);
      } catch (uploadError) {
        await supabase.from("rental_intakes").delete().eq("id", row.id);
        const message =
          uploadError instanceof Error ? uploadError.message : "Photo upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
      }

      const { error: updateError } = await supabase
        .from("rental_intakes")
        .update({ photo_urls: photoUrls })
        .eq("id", row.id);

      if (updateError) {
        await supabase.from("rental_intakes").delete().eq("id", row.id);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ id: row.id, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
