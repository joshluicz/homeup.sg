export type BlueprintRoom = {
  label: string;
  duration_seconds?: number;
  script?: string;
  presenter_direction?: string;
  higgsfield_prompt?: string;
  r2_url?: string;
  image_urls?: string[];
  cleaned_image_urls?: string[];
};

export type Blueprint = {
  blueprint_id: string;
  hook_script?: string;
  rooms?: BlueprintRoom[];
  cta_script?: string;
  colour_grade?: string;
  edit_notes?: string;
  presentation_guide?: string;
  property_name?: string;
  status?: string;
  created_at?: string;
  input_data?: BlueprintInputData;
};

export type GenerateBlueprintResponse = {
  status?: string;
  blueprint_id?: string;
  message?: string;
};

type ShotListEntry = {
  label?: string;
  duration_seconds?: number;
  script?: string;
  presenter_direction?: string;
  higgsfield_prompt?: string;
  r2_url?: string;
  image_urls?: string[];
  cleaned_image_urls?: string[];
};

type EditInstructions = {
  edit_notes?: string;
  presentation_guide?: string;
  colorgrade_notes?: string;
};

export type BlueprintRow = {
  id: string;
  property_name?: string | null;
  script?: string | null;
  shot_list?: ShotListEntry[] | string | null;
  edit_instructions?: EditInstructions | string | null;
  notes?: string | null;
  status?: string | null;
  created_at?: string | null;
  input_data?: BlueprintInputData | string | null;
};

export type SavedBlueprintSummary = {
  id: string;
  property_name: string;
  status: string;
  created_at: string;
};

export type BlueprintRoomPhotoInput = {
  label: string;
  r2_url: string;
  duration_seconds?: number;
  image_urls?: string[];
  cleaned_image_urls?: string[];
};

export type BlueprintInputData = {
  address: string;
  listing_title?: string;
  listing_type?: string;
  property_type?: string;
  rooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  area_sqm?: string;
  price_range?: string;
  price_psf?: string;
  tenure?: string;
  condition?: string;
  renovation_status?: string;
  selling_points?: string;
  agent_notes?: string;
  seconds_per_room?: number;
  room_photos?: BlueprintRoomPhotoInput[];
};

export type BlueprintSaveMeta = {
  address: string;
  uploadedBy: string;
  inputData?: BlueprintInputData;
};

function parseJsonField<T>(value: T | string | null | undefined): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function parseScriptSections(script: string): {
  hook_script: string;
  cta_script: string;
} {
  const hookMatch = script.match(/=== HOOK ===\s*\n([\s\S]*?)(?=\n===|\s*$)/);
  const ctaMatch = script.match(/=== CTA ===\s*\n([\s\S]*)$/);

  return {
    hook_script: hookMatch?.[1]?.trim() ?? "",
    cta_script: ctaMatch?.[1]?.trim() ?? "",
  };
}

export function blueprintFromRow(row: BlueprintRow): Blueprint {
  const script = row.script ?? "";
  const { hook_script, cta_script } = parseScriptSections(script);

  const shotList = parseJsonField<ShotListEntry[]>(row.shot_list) ?? [];
  const editInstructions =
    parseJsonField<EditInstructions>(row.edit_instructions) ?? {};
  const inputData = parseJsonField<BlueprintInputData>(row.input_data) ?? undefined;

  const rooms: BlueprintRoom[] = shotList.map((entry) => ({
    label: String(entry.label ?? ""),
    duration_seconds: entry.duration_seconds,
    script: entry.script,
    presenter_direction: entry.presenter_direction,
    higgsfield_prompt: entry.higgsfield_prompt,
    r2_url: entry.r2_url,
    image_urls: entry.image_urls?.length
      ? entry.image_urls
      : entry.r2_url
        ? [entry.r2_url]
        : undefined,
    cleaned_image_urls: entry.cleaned_image_urls?.length
      ? entry.cleaned_image_urls
      : undefined,
  }));

  return {
    blueprint_id: row.id,
    hook_script,
    cta_script,
    rooms,
    edit_notes: editInstructions.edit_notes,
    presentation_guide:
      editInstructions.presentation_guide ?? row.notes ?? undefined,
    colour_grade: editInstructions.colorgrade_notes,
    property_name: row.property_name ?? undefined,
    status: row.status ?? undefined,
    created_at: row.created_at ?? undefined,
    input_data: inputData,
  };
}

export function normalizeRoomLabel(label: string): string {
  return label.trim().toLowerCase();
}

/** Resolve ordered source image URLs; legacy single `r2_url` becomes a one-element array. */
export function roomImageUrls(input: {
  r2_url?: string;
  image_urls?: string[];
}): string[] {
  if (input.image_urls?.length) {
    return input.image_urls;
  }
  if (input.r2_url) {
    return [input.r2_url];
  }
  return [];
}

function resolveRoomPhotoFields(source: {
  r2_url?: string;
  image_urls?: string[];
  cleaned_image_urls?: string[];
}): {
  r2_url: string;
  image_urls: string[];
  cleaned_image_urls?: string[];
} {
  const image_urls = roomImageUrls(source);
  const cleaned_image_urls = source.cleaned_image_urls?.length
    ? source.cleaned_image_urls
    : undefined;

  return {
    r2_url: image_urls[0] ?? source.r2_url ?? "",
    image_urls,
    ...(cleaned_image_urls ? { cleaned_image_urls } : {}),
  };
}

/** Align stored photo URLs with blueprint room labels (Claude may rename rooms). */
export function remappedRoomPhotos(
  rooms: BlueprintRoom[],
  inputPhotos: BlueprintRoomPhotoInput[] | undefined,
): BlueprintRoomPhotoInput[] {
  if (!inputPhotos?.length) {
    return rooms
      .filter((room) => room.r2_url || room.image_urls?.length)
      .map((room) => {
        const resolved = resolveRoomPhotoFields(room);
        return {
          label: room.label,
          r2_url: resolved.r2_url,
          duration_seconds: room.duration_seconds,
          image_urls: resolved.image_urls,
          ...(resolved.cleaned_image_urls
            ? { cleaned_image_urls: resolved.cleaned_image_urls }
            : {}),
        };
      });
  }

  return rooms.map((room, index) => {
    const byLabel = inputPhotos.find(
      (photo) =>
        photo.label === room.label ||
        normalizeRoomLabel(photo.label) === normalizeRoomLabel(room.label),
    );
    const byIndex = inputPhotos[index];
    const source = byLabel ?? byIndex;

    const merged = resolveRoomPhotoFields({
      r2_url: source?.r2_url ?? room.r2_url,
      image_urls: source?.image_urls ?? room.image_urls,
      cleaned_image_urls:
        source?.cleaned_image_urls ?? room.cleaned_image_urls,
    });

    return {
      label: room.label,
      r2_url: merged.r2_url,
      duration_seconds:
        room.duration_seconds ?? source?.duration_seconds ?? undefined,
      image_urls: merged.image_urls,
      ...(merged.cleaned_image_urls
        ? { cleaned_image_urls: merged.cleaned_image_urls }
        : {}),
    };
  });
}

export type ApproveRoomPhoto = {
  label: string;
  r2_url: string;
  higgsfield_prompt: string;
  duration_seconds: number;
  image_urls?: string[];
};

export function buildApproveRoomPhotos(
  blueprint: Blueprint,
  options: {
    ref?: Map<string, string>;
    entries?: Array<{
      label: string;
      r2Url?: string | null;
      imageUrls?: string[];
      durationSeconds?: number;
    }>;
    defaultDuration?: number;
    labels?: string[];
  } = {},
): ApproveRoomPhoto[] {
  const rooms = blueprint.rooms ?? [];
  const selected = options.labels
    ? rooms.filter((room) => options.labels!.includes(room.label))
    : rooms;
  const remapped = remappedRoomPhotos(rooms, blueprint.input_data?.room_photos);
  const remappedByLabel = new Map(remapped.map((photo) => [photo.label, photo]));

  return selected.map((room) => {
    const entry = options.entries?.find((item) => item.label === room.label);
    const stored = remappedByLabel.get(room.label);
    const r2_url =
      options.ref?.get(room.label) ??
      entry?.r2Url ??
      room.r2_url ??
      stored?.r2_url ??
      "";

    const image_urls = roomImageUrls({
      r2_url,
      image_urls:
        entry?.imageUrls ?? room.image_urls ?? stored?.image_urls ?? undefined,
    });

    return {
      label: room.label,
      r2_url: image_urls[0] ?? r2_url,
      image_urls,
      higgsfield_prompt: room.higgsfield_prompt ?? "",
      duration_seconds:
        entry?.durationSeconds ??
        room.duration_seconds ??
        stored?.duration_seconds ??
        options.defaultDuration ??
        5,
    };
  });
}

export function buildFullScript(blueprint: Blueprint): string {
  const rooms = blueprint.rooms ?? [];
  return [
    "=== HOOK ===",
    blueprint.hook_script ?? "",
    "",
    ...rooms.flatMap((room) => [
      `=== ${room.label.toUpperCase()}${room.duration_seconds != null ? ` (${room.duration_seconds}s)` : ""} ===`,
      room.script ?? "",
      room.presenter_direction
        ? `[Presenter direction: ${room.presenter_direction}]`
        : "",
      "",
    ]),
    "=== CTA ===",
    blueprint.cta_script ?? "",
  ]
    .filter((line, index, arr) => line !== "" || arr[index + 1] !== "")
    .join("\n");
}

export function blueprintToDbRow(
  blueprint: Blueprint,
  meta: BlueprintSaveMeta,
): Record<string, unknown> {
  const rooms = blueprint.rooms ?? [];
  const remappedPhotos = remappedRoomPhotos(rooms, meta.inputData?.room_photos);

  return {
    id: blueprint.blueprint_id,
    property_name: meta.address,
    uploaded_by: meta.uploadedBy,
    content_type: "short",
    category: "house_tour",
    script: buildFullScript(blueprint),
    shot_list: rooms.map((room, index) => {
      const photo = remappedPhotos[index];
      const resolved = resolveRoomPhotoFields({
        r2_url: photo?.r2_url ?? room.r2_url,
        image_urls: photo?.image_urls ?? room.image_urls,
        cleaned_image_urls:
          photo?.cleaned_image_urls ?? room.cleaned_image_urls,
      });

      return {
        order: index + 1,
        label: room.label,
        duration_seconds: room.duration_seconds,
        script: room.script ?? "",
        presenter_direction: room.presenter_direction ?? "",
        higgsfield_prompt: room.higgsfield_prompt ?? "",
        r2_url: resolved.r2_url,
        image_urls: resolved.image_urls,
        ...(resolved.cleaned_image_urls
          ? { cleaned_image_urls: resolved.cleaned_image_urls }
          : {}),
      };
    }),
    edit_instructions: {
      edit_notes: blueprint.edit_notes ?? "",
      colorgrade_notes: blueprint.colour_grade ?? "",
      presentation_guide: blueprint.presentation_guide ?? "",
      sequence: ["hook", ...rooms.map((room) => room.label), "cta"],
    },
    notes: blueprint.presentation_guide ?? "",
    status: "draft",
    input_data: meta.inputData
      ? {
          ...meta.inputData,
          room_photos: remappedPhotos,
        }
      : null,
  };
}

export function blueprintFromWebhookPayload(
  data: Record<string, unknown>,
): Blueprint | null {
  const blueprintId = data.blueprint_id ?? data.id;
  if (!blueprintId) return null;

  if (data.hook_script || data.room_scripts || data.rooms) {
    const roomsRaw = data.rooms ?? data.room_scripts;
    const rooms: BlueprintRoom[] = Array.isArray(roomsRaw)
      ? roomsRaw.map((room) => {
          const r = room as Record<string, unknown>;
          const r2_url = r.r2_url != null ? String(r.r2_url) : undefined;
          const image_urls = Array.isArray(r.image_urls)
            ? r.image_urls.map(String).filter(Boolean)
            : undefined;
          const cleaned_image_urls = Array.isArray(r.cleaned_image_urls)
            ? r.cleaned_image_urls.map(String).filter(Boolean)
            : undefined;

          return {
            label: String(r.label ?? r.room ?? ""),
            duration_seconds:
              Number(r.duration_seconds ?? r.duration ?? 0) || undefined,
            script: String(r.script ?? r.script_text ?? ""),
            presenter_direction: String(
              r.presenter_direction ?? r.direction ?? "",
            ),
            higgsfield_prompt: String(
              r.higgsfield_prompt ?? r.prompt ?? "",
            ),
            r2_url,
            image_urls: image_urls?.length
              ? image_urls
              : r2_url
                ? [r2_url]
                : undefined,
            cleaned_image_urls: cleaned_image_urls?.length
              ? cleaned_image_urls
              : undefined,
          };
        })
      : [];

    return {
      blueprint_id: String(blueprintId),
      hook_script: String(data.hook_script ?? data.hook ?? ""),
      rooms,
      cta_script: String(data.cta_script ?? data.cta ?? ""),
      colour_grade: String(
        data.colour_grade ?? data.color_grade ?? data.colorgrade_notes ?? "",
      ),
      edit_notes: String(data.edit_notes ?? ""),
      presentation_guide: String(data.presentation_guide ?? ""),
    };
  }

  return {
    blueprint_id: String(blueprintId),
  };
}
