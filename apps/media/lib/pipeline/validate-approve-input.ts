import {
  assignUniqueClipSlugs,
  clipFileNameForSlug,
  clipR2KeyForSlug,
  expandPhotoLabels,
} from "@/lib/pipeline/room-label";
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

type ExpandedPhotoEntry = {
  label: string;
  imageUrl: string;
  higgsfield_prompt: string;
  duration_seconds: number;
};

/**
 * Expand each room into one task per photo.
 * A room with N photos produces N tasks, labelled "Room", "Room (2)", "Room (3)", etc.
 * Each task targets a single image so it always uses Seedance 1.5.
 */
export function splitRoomsForProcessing(
  blueprint_id: string,
  room_photos: ApproveRoomPhoto[],
): RoomClipTask[] {
  const entries: ExpandedPhotoEntry[] = room_photos.flatMap((photo) => {
    const urls =
      Array.isArray(photo.image_urls) && photo.image_urls.length > 0
        ? photo.image_urls.filter((u) => typeof u === "string" && u.trim() !== "")
        : photo.r2_url
          ? [photo.r2_url]
          : [];

    const subLabels = expandPhotoLabels(photo.label, urls.length || 1);

    if (urls.length === 0) {
      return [
        {
          label: subLabels[0],
          imageUrl: photo.r2_url,
          higgsfield_prompt: photo.higgsfield_prompt,
          duration_seconds: photo.duration_seconds || 6,
        },
      ];
    }

    return urls.map((url, i) => ({
      label: subLabels[i],
      imageUrl: url,
      higgsfield_prompt: photo.higgsfield_prompt,
      duration_seconds: photo.duration_seconds || 6,
    }));
  });

  const slugs = assignUniqueClipSlugs(entries.map((e) => e.label));

  return entries.map((entry, index) => {
    const slug = slugs[index]!;
    return {
      blueprint_id,
      label: entry.label,
      r2_url: entry.imageUrl,
      image_urls: [entry.imageUrl],
      higgsfield_prompt: entry.higgsfield_prompt,
      duration_seconds: entry.duration_seconds,
      file_name: clipFileNameForSlug(slug),
      r2_key: clipR2KeyForSlug(blueprint_id, slug),
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
