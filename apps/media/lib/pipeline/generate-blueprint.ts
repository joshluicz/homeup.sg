import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GenerateBlueprintResult,
  ParsedBlueprint,
} from "@/lib/pipeline/types";
import { buildClaudeRequest } from "@/lib/pipeline/build-claude-request";
import type { PipelineRunLogger } from "@/lib/pipeline/execution-log";
import { parseBlueprintJson } from "@/lib/pipeline/parse-blueprint-json";
import { validateGenerateInput } from "@/lib/pipeline/validate-generate-input";

function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  return key;
}

async function callClaude(body: ReturnType<typeof buildClaudeRequest>) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getAnthropicApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      text.trim() || `Anthropic API failed (${response.status})`,
    );
  }

  let data: { content?: Array<{ type?: string; text?: string }> };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from Anthropic: ${text.slice(0, 200)}`);
  }

  const claudeText = data.content?.[0]?.text;
  if (!claudeText) {
    throw new Error("Anthropic response missing text content");
  }

  return claudeText;
}

async function saveBlueprintRow(
  supabase: SupabaseClient,
  parsed: ParsedBlueprint,
): Promise<string> {
  const { data, error } = await supabase
    .from("blueprints")
    .insert({
      property_name: parsed.address,
      uploaded_by: parsed.uploaded_by,
      content_type: "short",
      category: "house_tour",
      script: parsed.full_script,
      shot_list: parsed.shot_list,
      edit_instructions: parsed.edit_instructions,
      notes: parsed.presentation_guide,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to save blueprint");
  }

  return data.id;
}

export async function runGenerateBlueprint(
  supabase: SupabaseClient,
  body: unknown,
  execution?: PipelineRunLogger,
): Promise<GenerateBlueprintResult> {
  const logger = execution ?? null;
  const input = await logger?.step(
    "validate_input",
    "Validate generate input",
    () => validateGenerateInput(body),
  ) ?? validateGenerateInput(body);
  const claudeBody = await logger?.step(
    "build_claude_request",
    "Build Claude request",
    () => buildClaudeRequest(input),
    {
      outputSummary: {
        model: "claude-sonnet-4-6",
        room_count: input.room_count,
      },
    },
  ) ?? buildClaudeRequest(input);
  const claudeText = await logger?.step(
    "call_claude",
    "Generate blueprint with Claude",
    () => callClaude(claudeBody),
  ) ?? await callClaude(claudeBody);
  const parsed = await logger?.step(
    "parse_blueprint_json",
    "Parse blueprint JSON",
    () => parseBlueprintJson(claudeText, input),
    {
      outputSummary: {
        room_count: input.room_count,
        script_chars: claudeText.length,
      },
    },
  ) ?? parseBlueprintJson(claudeText, input);
  const blueprintId = await logger?.step(
    "save_blueprint",
    "Save blueprint to Supabase",
    () => saveBlueprintRow(supabase, parsed),
  ) ?? await saveBlueprintRow(supabase, parsed);

  return {
    status: "success",
    blueprint_id: blueprintId,
    message: "Blueprint generated and saved.",
  };
}

export type { ParsedBlueprint };
