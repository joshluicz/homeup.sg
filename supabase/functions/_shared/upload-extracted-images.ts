import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { uploadListingImageFromBuffer } from "./storage.ts";
import { MAX_IMAGES, PG_USER_AGENT } from "./types.ts";

type UploadResult = {
  featured_image_url: string | null;
  image_urls: string[];
  warnings: string[];
};

function extFromContentType(contentType: string | null, url: string): string {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  const urlMatch = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  if (urlMatch) return urlMatch[1].toLowerCase().replace("jpeg", "jpg");
  return "jpg";
}

export async function uploadExtractedImages(
  supabase: SupabaseClient,
  listingId: string,
  imageUrls: string[],
): Promise<UploadResult> {
  const warnings: string[] = [];
  const uploaded: string[] = [];

  const urls = imageUrls.slice(0, MAX_IMAGES);

  for (const imageUrl of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const res = await fetch(imageUrl, {
        headers: {
          "User-Agent": PG_USER_AGENT,
          Accept: "image/*",
          Referer: "https://www.propertyguru.com.sg/",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        warnings.push(`Skipped image (HTTP ${res.status}): ${imageUrl}`);
        continue;
      }

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length < 1024) {
        warnings.push(`Skipped image (too small): ${imageUrl}`);
        continue;
      }

      const ext = extFromContentType(res.headers.get("content-type"), imageUrl);
      const publicUrl = await uploadListingImageFromBuffer(
        supabase,
        listingId,
        bytes,
        ext,
      );
      uploaded.push(publicUrl);
    } catch {
      warnings.push(`Skipped image (download failed): ${imageUrl}`);
    }
  }

  return {
    featured_image_url: uploaded[0] ?? null,
    image_urls: uploaded.slice(1),
    warnings,
  };
}
