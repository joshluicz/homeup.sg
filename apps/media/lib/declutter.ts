import { fal } from "@fal-ai/client";
import { archiveRemoteFileToR2 } from "@/lib/r2";

export const DEFAULT_DECLUTTER_ERASE_PROMPT =
  "loose clutter, personal items, visible trash, cables, bags, laundry, and distracting small objects";

export const DEFAULT_DECLUTTER_INSTRUCTIONS =
  "Remove loose clutter, personal items, visible trash, cables, bags, laundry, and distracting small objects. " +
  "Preserve all permanent architecture, room dimensions, walls, floors, windows, doors, built-in cabinetry, major furniture, lighting direction, and camera angle. " +
  "Do not add new furniture. Do not redesign or restyle the room.";

const FAL_MODEL = "fal-ai/finegrain-eraser";

function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "room";
}

export function buildCleanedPhotoKey(
  sessionOrBlueprintId: string,
  roomLabel: string,
  index: number,
): string {
  return `room-photos-cleaned/${sessionOrBlueprintId}/${slugifyLabel(roomLabel)}/${index}.jpg`;
}

function getFalApiKey(): string {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_API_KEY is not configured");
  }
  return apiKey;
}

function extractOutputUrl(data: unknown): string {
  if (!data || typeof data !== "object") {
    throw new Error("Declutter model returned no image");
  }

  const record = data as Record<string, unknown>;
  const image = record.image;
  if (image && typeof image === "object" && "url" in image) {
    const url = (image as { url?: unknown }).url;
    if (typeof url === "string" && url) return url;
  }

  if (typeof record.url === "string" && record.url) {
    return record.url;
  }

  throw new Error("Declutter model returned no image URL");
}

export async function declutterImageToR2(options: {
  sourceUrl: string;
  r2Key: string;
  prompt?: string;
}): Promise<{ cleaned_r2_url: string; r2_key: string }> {
  fal.config({ credentials: getFalApiKey() });

  const result = await fal.subscribe(FAL_MODEL, {
    input: {
      image_url: options.sourceUrl,
      prompt: options.prompt ?? DEFAULT_DECLUTTER_ERASE_PROMPT,
      mode: "standard",
    },
  });

  const outputUrl = extractOutputUrl(result.data);
  const archived = await archiveRemoteFileToR2(outputUrl, options.r2Key);

  return {
    cleaned_r2_url: archived.r2_url,
    r2_key: options.r2Key,
  };
}
