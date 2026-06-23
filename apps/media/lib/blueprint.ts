export type BlueprintRoom = {
  label: string;
  duration_seconds?: number;
  script?: string;
  presenter_direction?: string;
  higgsfield_prompt?: string;
};

export type Blueprint = {
  blueprint_id: string;
  hook_script?: string;
  rooms?: BlueprintRoom[];
  cta_script?: string;
  colour_grade?: string;
  edit_notes?: string;
  presentation_guide?: string;
};

export type N8nGenerateResponse = {
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
};

type EditInstructions = {
  edit_notes?: string;
  presentation_guide?: string;
  colorgrade_notes?: string;
};

export type BlueprintRow = {
  id: string;
  script?: string | null;
  shot_list?: ShotListEntry[] | string | null;
  edit_instructions?: EditInstructions | string | null;
  notes?: string | null;
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

  const rooms: BlueprintRoom[] = shotList.map((entry) => ({
    label: String(entry.label ?? ""),
    duration_seconds: entry.duration_seconds,
    script: entry.script,
    presenter_direction: entry.presenter_direction,
    higgsfield_prompt: entry.higgsfield_prompt,
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
