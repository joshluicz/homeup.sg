import type { BlueprintRoomPhotoInput } from "@/lib/blueprint";

export type GenerateBlueprintInput = {
  address: string;
  property_type: string;
  rooms: string;
  listing_title: string;
  listing_type: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  area_sqm: string;
  price_range: string;
  price_psf: string;
  tenure: string;
  condition: string;
  selling_points: string;
  renovation_status: string;
  agent_notes: string;
  uploaded_by: string;
  room_photos: BlueprintRoomPhotoInput[];
  room_list: string;
  room_count: number;
  words_per_room: number;
  seconds_per_room: number;
};

export type ClaudeRoomScript = {
  label: string;
  script: string;
  duration_seconds: number;
  presenter_direction: string;
  higgsfield_prompt: string;
};

export type ParsedBlueprint = {
  address: string;
  property_type: string;
  uploaded_by: string;
  room_photos: BlueprintRoomPhotoInput[];
  full_script: string;
  shot_list: Array<{
    order: number;
    label: string;
    duration_seconds: number;
    script: string;
    presenter_direction: string;
    higgsfield_prompt: string;
  }>;
  edit_instructions: {
    edit_notes: string;
    presentation_guide: string;
    colorgrade_notes: string;
    sequence: string[];
  };
  hook_script: string;
  cta_script: string;
  edit_notes: string;
  presentation_guide: string;
  room_scripts: ClaudeRoomScript[];
  colorgrade_notes: string;
};

export type ApproveRoomPhoto = {
  label: string;
  r2_url: string;
  image_urls?: string[];
  higgsfield_prompt: string;
  duration_seconds?: number;
};

export type RoomClipTask = {
  blueprint_id: string;
  label: string;
  r2_url: string;
  image_urls: string[];
  higgsfield_prompt: string;
  duration_seconds: number;
  file_name: string;
  r2_key: string;
};

export type GenerateBlueprintResult = {
  status: "success";
  blueprint_id: string;
  message: string;
};

export type ApproveBlueprintResult = {
  status: "success";
  message: string;
  room_count: number;
};

export type AdvanceClipsResult = {
  advanced: number;
  done: number;
  failed: number;
  still_processing: number;
};
