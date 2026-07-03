import type { BlueprintRoomPhotoInput } from "@/lib/blueprint";
import type { GenerateBlueprintInput } from "@/lib/pipeline/types";

function resolvePhotoImageUrls(photo: BlueprintRoomPhotoInput): string[] {
  if (Array.isArray(photo.image_urls) && photo.image_urls.length > 0) {
    return photo.image_urls.filter(
      (url) => typeof url === "string" && url.trim() !== "",
    );
  }
  if (photo.r2_url) {
    return [photo.r2_url];
  }
  return [];
}

export function validateGenerateInput(body: unknown): GenerateBlueprintInput {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const raw = body as Record<string, unknown>;
  const required = [
    "address",
    "property_type",
    "selling_points",
    "uploaded_by",
    "room_photos",
  ] as const;

  for (const field of required) {
    if (raw[field] == null || raw[field] === "") {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!Array.isArray(raw.room_photos) || raw.room_photos.length === 0) {
    throw new Error("room_photos must be a non-empty array");
  }

  const room_photos = (raw.room_photos as BlueprintRoomPhotoInput[]).map(
    (photo) => ({ ...photo }),
  );

  for (const photo of room_photos) {
    if (!photo.label) {
      throw new Error("Each room_photos entry needs label");
    }

    const imageUrls = resolvePhotoImageUrls(photo);
    if (imageUrls.length === 0) {
      throw new Error(
        "Each room_photos entry needs at least one image (r2_url or image_urls)",
      );
    }

    if (!photo.r2_url) {
      photo.r2_url = imageUrls[0];
    }
  }

  const roomList = `PROPERTY ADDRESS: ${raw.address}\n\nROOMS:\n${room_photos
    .map((photo) => {
      const urls = resolvePhotoImageUrls(photo);
      const duration =
        photo.duration_seconds ||
        Number(raw.seconds_per_room) ||
        5;
      const urlLines = urls
        .map((url, index) => `  - @Image${index + 1}: ${url}`)
        .join("\n");
      const multiNote =
        urls.length > 1
          ? `\n  (${urls.length} reference photos — write higgsfield_prompt using @Image1, @Image2, etc.)`
          : "";
      return `- ${photo.label} (${duration}s):\n${urlLines}${multiNote}`;
    })
    .join("\n")}`;

  const roomCount = room_photos.length;
  const wordsPerRoom =
    Number(raw.words_per_room) || Math.max(20, Math.floor(195 / roomCount));
  const secondsPerRoom =
    Number(raw.seconds_per_room) ||
    Math.max(5, Math.round((wordsPerRoom / 130) * 60));

  return {
    address: String(raw.address),
    property_type: String(raw.property_type),
    rooms: String(raw.rooms ?? "Not specified"),
    listing_title: String(raw.listing_title ?? "Not specified"),
    listing_type: String(raw.listing_type ?? "For Sale"),
    bedrooms: String(raw.bedrooms ?? "Not specified"),
    bathrooms: String(raw.bathrooms ?? "Not specified"),
    sqft: String(raw.sqft ?? "Not specified"),
    area_sqm: String(raw.area_sqm ?? "Not specified"),
    price_range: String(raw.price_range ?? "Not specified"),
    price_psf: String(raw.price_psf ?? "Not specified"),
    tenure: String(raw.tenure ?? "Not specified"),
    condition: String(raw.condition ?? "Not specified"),
    selling_points: String(raw.selling_points),
    renovation_status: String(raw.renovation_status ?? "Move-in ready"),
    agent_notes: String(raw.agent_notes ?? "None"),
    uploaded_by: String(raw.uploaded_by),
    room_photos,
    room_list: roomList,
    room_count: roomCount,
    words_per_room: wordsPerRoom,
    seconds_per_room: secondsPerRoom,
  };
}
