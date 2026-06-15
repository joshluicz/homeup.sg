import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { cleanHtml } from "./clean-html.ts";
import { extractImageUrls } from "./extract-image-urls.ts";
import { extractWithClaude } from "./extract-with-claude.ts";
import { fetchListingPage } from "./fetch-listing-page.ts";
import { mapToFormData } from "./map-to-form-data.ts";
import type { ImportResponse } from "./types.ts";
import { uploadExtractedImages } from "./upload-extracted-images.ts";

export type ImportRequestBody = {
  url?: string;
  html?: string;
  listingId: string;
};

export async function runListingImport(
  supabase: SupabaseClient,
  body: ImportRequestBody,
): Promise<ImportResponse> {
  const { url, html, listingId } = body;

  if (!listingId?.trim()) {
    return { success: false, error: "listingId is required" };
  }

  const hasUrl = Boolean(url?.trim());
  const hasHtml = Boolean(html?.trim());

  if (hasUrl === hasHtml) {
    return { success: false, error: "Provide exactly one of url or html" };
  }

  let rawHtml: string;
  let urlHint: string | undefined;

  if (hasUrl) {
    const fetchResult = await fetchListingPage(url!.trim());
    if (!fetchResult.ok) {
      if (fetchResult.error === "FETCH_BLOCKED") {
        return { success: false, error: "FETCH_BLOCKED" };
      }
      return { success: false, error: fetchResult.error };
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

    return { success: true, data, warnings };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import extraction failed";
    return { success: false, error: message };
  }
}
