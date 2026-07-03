import type {
  ApproveRoomPhoto,
  ApproveBlueprintResult,
  RoomClipTask,
} from "@/lib/pipeline/types";

export function validateApproveInput(body: unknown): {
  blueprint_id: string;
  room_photos: ApproveRoomPhoto[];
} {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const raw = body as Record<string, unknown>;

  if (!raw.blueprint_id) {
    throw new Error("Missing blueprint_id");
  }

  if (!Array.isArray(raw.room_photos)) {
    throw new Error("Missing room_photos array");
  }

  const room_photos = raw.room_photos as ApproveRoomPhoto[];

  for (const photo of room_photos) {
    if (!photo.label || !photo.r2_url) {
      throw new Error("Each room_photos entry needs label and r2_url");
    }
  }

  return {
    blueprint_id: String(raw.blueprint_id),
    room_photos,
  };
}

function labelToSlug(label: string): string {
  return label.toLowerCase().replace(/ /g, "_");
}

export function splitRoomsForProcessing(
  blueprint_id: string,
  room_photos: ApproveRoomPhoto[],
): RoomClipTask[] {
  return room_photos.map((photo) => {
    const image_urls =
      Array.isArray(photo.image_urls) && photo.image_urls.length > 0
        ? photo.image_urls
        : photo.r2_url
          ? [photo.r2_url]
          : [];
    const r2_url = image_urls[0] ?? photo.r2_url;
    const slug = labelToSlug(photo.label);

    return {
      blueprint_id,
      label: photo.label,
      r2_url,
      image_urls,
      higgsfield_prompt: photo.higgsfield_prompt,
      duration_seconds: photo.duration_seconds || 6,
      file_name: `room_clip_${slug}.mp4`,
      r2_key: `room-clips/${blueprint_id}/${slug}.mp4`,
    };
  });
}

export function buildApproveSuccessMessage(roomCount: number): string {
  return `Blueprint approved. Room clip generation started for ${roomCount} rooms.`;
}

export function buildApproveResult(roomCount: number): ApproveBlueprintResult {
  return {
    status: "success",
    message: buildApproveSuccessMessage(roomCount),
    room_count: roomCount,
  };
}
