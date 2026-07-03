import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GenerateBlueprintInput } from "@/lib/pipeline/types";

let cachedPrompt: string | null = null;

function loadBlueprintSystemPrompt(): string {
  if (cachedPrompt) return cachedPrompt;
  cachedPrompt = readFileSync(
    join(process.cwd(), "lib/pipeline/prompts/blueprint-system-prompt.txt"),
    "utf8",
  );
  return cachedPrompt;
}

export function buildClaudeRequest(input: GenerateBlueprintInput) {
  const userMessage = `This property is located at: ${input.address}. Do not reference any other location.

Generate a production blueprint for this property tour video.

PROPERTY DETAILS:
Listing title: ${input.listing_title}
Listing type: ${input.listing_type}
Address: ${input.address}
Type: ${input.property_type}
Rooms: ${input.rooms}
Bedrooms: ${input.bedrooms}
Bathrooms: ${input.bathrooms}
Size: ${input.sqft} sqft
Area: ${input.area_sqm} sqm
Price range: ${input.price_range}
Price psf: ${input.price_psf}
Tenure: ${input.tenure}
Condition: ${input.condition}
Selling points: ${input.selling_points}
Renovation status: ${input.renovation_status}
Agent notes: ${input.agent_notes || "None"}

ROOM PHOTOS (each will become an animated B-roll clip):
${input.room_list}

TIMING: Each room segment should target ~${input.seconds_per_room} seconds of presenter speech (~${input.words_per_room} words per room).`;

  return {
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: [
      {
        type: "text",
        text: loadBlueprintSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  };
}
