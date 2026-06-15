import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { cleanHtml } from "@/lib/listings/import/clean-html";
import { extractImageUrls } from "@/lib/listings/import/extract-image-urls";
import { extractWithClaude } from "@/lib/listings/import/extract-with-claude";
import { fetchListingPage } from "@/lib/listings/import/fetch-listing-page";
import { mapToFormData } from "@/lib/listings/import/map-to-form-data";
import type { ImportResponse } from "@/lib/listings/import/types";
import { uploadExtractedImages } from "@/lib/listings/import/upload-extracted-images";

export const maxDuration = 60;

type ImportRequestBody = {
  url?: string;
  html?: string;
  listingId?: string;
};

export async function POST(request: Request) {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  let body: ImportRequestBody;
  try {
    body = (await request.json()) as ImportRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" } satisfies ImportResponse,
      { status: 400 },
    );
  }

  const { url, html, listingId } = body;

  if (!listingId?.trim()) {
    return NextResponse.json(
      { success: false, error: "listingId is required" } satisfies ImportResponse,
      { status: 400 },
    );
  }

  const hasUrl = Boolean(url?.trim());
  const hasHtml = Boolean(html?.trim());

  if (hasUrl === hasHtml) {
    return NextResponse.json(
      {
        success: false,
        error: "Provide exactly one of url or html",
      } satisfies ImportResponse,
      { status: 400 },
    );
  }

  let rawHtml: string;
  let urlHint: string | undefined;

  if (hasUrl) {
    const fetchResult = await fetchListingPage(url!.trim());
    if (!fetchResult.ok) {
      if (fetchResult.error === "FETCH_BLOCKED") {
        return NextResponse.json(
          { success: false, error: "FETCH_BLOCKED" } satisfies ImportResponse,
          { status: 422 },
        );
      }
      return NextResponse.json(
        { success: false, error: fetchResult.error } satisfies ImportResponse,
        { status: 400 },
      );
    }
    rawHtml = fetchResult.html;
    urlHint = url!.trim();
  } else {
    rawHtml = html!.trim();
    urlHint = undefined;
  }

  try {
    const cleaned = cleanHtml(rawHtml);
    const imageUrls = extractImageUrls(rawHtml, urlHint);

    const extraction = await extractWithClaude(cleaned, urlHint);

    const { featured_image_url, image_urls, warnings: uploadWarnings } =
      await uploadExtractedImages(supabase, listingId.trim(), imageUrls);

    const { data, warnings } = mapToFormData({
      extraction,
      featured_image_url,
      image_urls,
      uploadWarnings,
      extractedImageCount: imageUrls.length,
    });

    return NextResponse.json({
      success: true,
      data,
      warnings,
    } satisfies ImportResponse);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Import extraction failed";
    return NextResponse.json(
      { success: false, error: message } satisfies ImportResponse,
      { status: 500 },
    );
  }
}
