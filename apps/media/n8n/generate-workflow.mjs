#!/usr/bin/env node
/**
 * Builds apps/media/n8n/homeup-media-pipeline.json for import into n8n.
 * Run: node apps/media/n8n/generate-workflow.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readCode(name) {
  return readFileSync(join(__dirname, "code", name), "utf8").trim();
}

function readPrompt() {
  return readFileSync(
    join(__dirname, "prompts", "blueprint-system-prompt.txt"),
    "utf8",
  );
}

function node(id, name, type, typeVersion, position, parameters, extra = {}) {
  return {
    parameters,
    id,
    name,
    type,
    typeVersion,
    position,
    ...extra,
  };
}

function codeNode(name, position, fileName) {
  let jsCode = readCode(fileName);
  if (fileName === "build-claude-request.js") {
    const prompt = JSON.stringify(readPrompt());
    jsCode = jsCode.replace("__BLUEPRINT_SYSTEM_PROMPT__", prompt);
  }
  return node(randomUUID(), name, "n8n-nodes-base.code", 2, position, { jsCode });
}

const blueprintSystemPrompt = readPrompt();

// Ensure build-claude-request gets prompt inlined
const buildClaudeCode = readCode("build-claude-request.js").replace(
  "__BLUEPRINT_SYSTEM_PROMPT__",
  JSON.stringify(blueprintSystemPrompt),
);

const nodes = [
  node(
    randomUUID(),
    "Blueprint Trigger",
    "n8n-nodes-base.webhook",
    2.1,
    [0, 0],
    {
      httpMethod: "POST",
      path: "homeup-generate-blueprint",
      responseMode: "responseNode",
      options: {},
    },
    { webhookId: "homeup-generate-blueprint" },
  ),
  codeNode("Parse & Validate Input", [240, 0], "parse-validate-input.js"),
  node(
    randomUUID(),
    "Build Claude Request",
    "n8n-nodes-base.code",
    2,
    [480, 0],
    { jsCode: buildClaudeCode },
  ),
  node(
    randomUUID(),
    "Generate Blueprint (Claude)",
    "n8n-nodes-base.httpRequest",
    4.4,
    [720, 0],
    {
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "anthropic-version", value: "2023-06-01" },
          { name: "Content-Type", value: "application/json" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ JSON.stringify($json.anthropic_body) }}",
      options: { timeout: 120000 },
    },
    {
      credentials: {
        httpHeaderAuth: { id: "REPLACE_ANTHROPIC_CREDENTIAL_ID", name: "Anthropic" },
      },
    },
  ),
  codeNode("Parse Blueprint JSON", [960, 0], "parse-blueprint-json.js"),
  node(
    randomUUID(),
    "Save Blueprint to Supabase",
    "n8n-nodes-base.supabase",
    1,
    [1200, 0],
    {
      tableId: "blueprints",
      fieldsUi: {
        fieldValues: [
          { fieldId: "property_name", fieldValue: "={{ $json.address }}" },
          { fieldId: "uploaded_by", fieldValue: "={{ $json.uploaded_by }}" },
          { fieldId: "content_type", fieldValue: "short" },
          { fieldId: "category", fieldValue: "house_tour" },
          { fieldId: "script", fieldValue: "={{ $json.full_script }}" },
          { fieldId: "shot_list", fieldValue: "={{ JSON.stringify($json.shot_list) }}" },
          {
            fieldId: "edit_instructions",
            fieldValue: "={{ JSON.stringify($json.edit_instructions) }}",
          },
          { fieldId: "notes", fieldValue: "={{ $json.presentation_guide }}" },
          { fieldId: "status", fieldValue: "draft" },
        ],
      },
    },
    {
      credentials: {
        supabaseApi: { id: "REPLACE_SUPABASE_CREDENTIAL_ID", name: "Supabase account" },
      },
    },
  ),
  codeNode("Capture Blueprint ID", [1440, 0], "capture-blueprint-id.js"),
  node(
    randomUUID(),
    "Respond to App",
    "n8n-nodes-base.respondToWebhook",
    1,
    [1680, 0],
    {
      respondWith: "json",
      responseBody:
        "={{ JSON.stringify({ status: 'success', blueprint_id: $json.blueprint_id, message: 'Blueprint generated and saved.' }) }}",
      options: {},
    },
  ),
  node(
    randomUUID(),
    "Approval Trigger",
    "n8n-nodes-base.webhook",
    2.1,
    [0, 320],
    {
      httpMethod: "POST",
      path: "homeup-approve-blueprint",
      responseMode: "responseNode",
      options: {},
    },
    { webhookId: "homeup-approve-blueprint" },
  ),
  codeNode("Parse Approval Input", [240, 320], "parse-approval-input.js"),
  node(
    randomUUID(),
    "Set Blueprint to Ready",
    "n8n-nodes-base.supabase",
    1,
    [480, 320],
    {
      operation: "update",
      tableId: "blueprints",
      filters: {
        conditions: [
          {
            keyName: "id",
            condition: "eq",
            keyValue: "={{ $json.blueprint_id }}",
          },
        ],
      },
      fieldsUi: {
        fieldValues: [{ fieldId: "status", fieldValue: "ready" }],
      },
    },
    {
      credentials: {
        supabaseApi: { id: "REPLACE_SUPABASE_CREDENTIAL_ID", name: "Supabase account" },
      },
    },
  ),
  node(
    randomUUID(),
    "Respond to Approval",
    "n8n-nodes-base.respondToWebhook",
    1,
    [720, 480],
    {
      respondWith: "json",
      responseBody:
        "={{ JSON.stringify({ status: 'success', message: 'Blueprint approved. Room clip generation started for ' + $('Parse Approval Input').first().json.room_photos.length + ' rooms.' }) }}",
      options: {},
    },
  ),
  codeNode("Split Rooms for Processing", [720, 320], "split-rooms.js"),
  node(
    randomUUID(),
    "Generate Room Clip",
    "n8n-nodes-base.httpRequest",
    4.4,
    [960, 320],
    {
      method: "POST",
      url: "https://ixhikkbytusikgjiuvqa.supabase.co/functions/v1/generate-room-clip",
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: "Content-Type", value: "application/json" }],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody:
        "={{ JSON.stringify({ blueprint_id: $json.blueprint_id, label: $json.label, r2_url: $json.r2_url, higgsfield_prompt: $json.higgsfield_prompt, duration_seconds: $json.duration_seconds }) }}",
      options: { timeout: 360000 },
    },
  ),
  codeNode("Parse Clip Response", [1200, 320], "parse-clip-response.js"),
  node(
    randomUUID(),
    "Save Room Clip to Supabase",
    "n8n-nodes-base.supabase",
    1,
    [1440, 320],
    {
      tableId: "media_files",
      fieldsUi: {
        fieldValues: [
          { fieldId: "job_id", fieldValue: "={{ $json.blueprint_id }}" },
          { fieldId: "file_name", fieldValue: "={{ $json.file_name }}" },
          { fieldId: "r2_key", fieldValue: "={{ $json.r2_key }}" },
          { fieldId: "r2_url", fieldValue: "={{ $json.video_url }}" },
          { fieldId: "duration_seconds", fieldValue: "={{ $json.duration_seconds }}" },
          { fieldId: "metadata", fieldValue: '={{ JSON.stringify({ label: $json.label }) }}' },
          { fieldId: "status", fieldValue: "done" },
        ],
      },
    },
    {
      credentials: {
        supabaseApi: { id: "REPLACE_SUPABASE_CREDENTIAL_ID", name: "Supabase account" },
      },
    },
  ),
];

const connections = {
  "Blueprint Trigger": {
    main: [[{ node: "Parse & Validate Input", type: "main", index: 0 }]],
  },
  "Parse & Validate Input": {
    main: [[{ node: "Build Claude Request", type: "main", index: 0 }]],
  },
  "Build Claude Request": {
    main: [[{ node: "Generate Blueprint (Claude)", type: "main", index: 0 }]],
  },
  "Generate Blueprint (Claude)": {
    main: [[{ node: "Parse Blueprint JSON", type: "main", index: 0 }]],
  },
  "Parse Blueprint JSON": {
    main: [[{ node: "Save Blueprint to Supabase", type: "main", index: 0 }]],
  },
  "Save Blueprint to Supabase": {
    main: [[{ node: "Capture Blueprint ID", type: "main", index: 0 }]],
  },
  "Capture Blueprint ID": {
    main: [[{ node: "Respond to App", type: "main", index: 0 }]],
  },
  "Approval Trigger": {
    main: [[{ node: "Parse Approval Input", type: "main", index: 0 }]],
  },
  "Parse Approval Input": {
    main: [[{ node: "Set Blueprint to Ready", type: "main", index: 0 }]],
  },
  "Set Blueprint to Ready": {
    main: [
      [
        { node: "Split Rooms for Processing", type: "main", index: 0 },
        { node: "Respond to Approval", type: "main", index: 0 },
      ],
    ],
  },
  "Split Rooms for Processing": {
    main: [[{ node: "Generate Room Clip", type: "main", index: 0 }]],
  },
  "Generate Room Clip": {
    main: [[{ node: "Parse Clip Response", type: "main", index: 0 }]],
  },
  "Parse Clip Response": {
    main: [[{ node: "Save Room Clip to Supabase", type: "main", index: 0 }]],
  },
};

const workflow = {
  name: "HomeUp Media Pipeline",
  nodes,
  connections,
  pinData: {},
  settings: { executionOrder: "v1" },
  meta: {
    templateCredsSetupCompleted: false,
    instanceId: randomUUID(),
  },
};

const outPath = join(__dirname, "homeup-media-pipeline.json");
writeFileSync(outPath, JSON.stringify(workflow, null, 2), "utf8");
console.log(`Wrote ${outPath} (${nodes.length} nodes)`);
