const raw = $input.first().json.content[0].text.trim();
const cleaned = raw
  .replace(/^```json/i, "")
  .replace(/^```/, "")
  .replace(/```$/, "")
  .trim();

let blueprint;
try {
  blueprint = JSON.parse(cleaned);
} catch (error) {
  throw new Error(
    "Failed to parse Claude blueprint JSON. Raw: " + cleaned.substring(0, 500),
  );
}

if (!blueprint.hook_script || !blueprint.room_scripts || !blueprint.cta_script) {
  throw new Error(
    "Blueprint missing required keys: " + Object.keys(blueprint).join(", "),
  );
}

const input = $("Parse & Validate Input").first().json;

const fullScript = [
  "=== HOOK ===",
  blueprint.hook_script,
  "",
  ...blueprint.room_scripts.flatMap((room) => [
    `=== ${room.label.toUpperCase()} (${room.duration_seconds}s) ===`,
    room.script,
    `[Presenter direction: ${room.presenter_direction}]`,
    "",
  ]),
  "=== CTA ===",
  blueprint.cta_script,
].join("\n");

const shotList = blueprint.room_scripts.map((room, index) => ({
  order: index + 1,
  label: room.label,
  duration_seconds: room.duration_seconds,
  script: room.script,
  presenter_direction: room.presenter_direction,
  higgsfield_prompt: room.higgsfield_prompt,
}));

const editInstructions = {
  edit_notes: blueprint.edit_notes,
  presentation_guide: blueprint.presentation_guide,
  colorgrade_notes: blueprint.colorgrade_notes || "",
  sequence: ["hook", ...blueprint.room_scripts.map((room) => room.label), "cta"],
};

return [
  {
    json: {
      address: input.address,
      property_type: input.property_type,
      uploaded_by: input.uploaded_by,
      room_photos: input.room_photos,
      full_script: fullScript,
      shot_list: shotList,
      edit_instructions: editInstructions,
      hook_script: blueprint.hook_script,
      cta_script: blueprint.cta_script,
      edit_notes: blueprint.edit_notes,
      presentation_guide: blueprint.presentation_guide,
      room_scripts: blueprint.room_scripts,
      colorgrade_notes: blueprint.colorgrade_notes || blueprint.edit_notes || "",
    },
  },
];
