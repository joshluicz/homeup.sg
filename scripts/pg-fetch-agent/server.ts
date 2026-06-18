/**
 * HomeUP PG Fetch Agent — runs on the admin's computer.
 * Chrome + patchright open locally; the live Vercel admin UI calls this via localhost.
 *
 * Setup (once per admin PC):
 *   1. Clone repo or copy project folder
 *   2. npm install && npm run pg:install
 *   3. Copy .env.local (Supabase keys)
 *   4. npm run pg:agent
 *   5. Open https://homeup-sg.vercel.app/admin → PG Sync → Fetch
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { fetchAndSaveEnabledAgentPgListings } from "../../lib/listings/fetch-agent-pg-sources";
import {
  PG_FETCH_AGENT_ORIGINS,
  PG_FETCH_AGENT_PORT,
} from "../../lib/listings/pg-fetch-agent-constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) throw new Error("Missing .env.local in project root");
  const env: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const value = m[2].trim();
      env[key] = value;
      if (!process.env[key]) process.env[key] = value;
    }
  }
  return env;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function setCors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  const extra = process.env.PG_FETCH_AGENT_ORIGINS?.split(",").map((s) => s.trim()) ?? [];
  const allowed = [...PG_FETCH_AGENT_ORIGINS, ...extra];
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function verifyAdmin(req: IncomingMessage) {
  const env = loadEnv();
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return supabase;
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = req.url ?? "/";

  if (req.method === "GET" && url === "/health") {
    json(res, 200, { ok: true, service: "homeup-pg-fetch-agent" });
    return;
  }

  if (req.method === "POST" && url === "/fetch") {
    const supabase = await verifyAdmin(req);
    if (!supabase) {
      json(res, 401, { success: false, error: "Not signed in — refresh admin and try again" });
      return;
    }

    console.log("[pg-agent] Fetch started — Chrome will open on this computer");
    try {
      const { results, skipped_agents, perAgentMode, totalNew } =
        await fetchAndSaveEnabledAgentPgListings(supabase);
      console.log("[pg-agent] Fetch done, totalNew:", totalNew);
      json(res, 200, { success: true, results, skipped_agents, perAgentMode, totalNew });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fetch failed";
      console.error("[pg-agent]", message);
      json(res, 500, { success: false, error: message });
    }
    return;
  }

  json(res, 404, { success: false, error: "Not found" });
}

const port = Number(process.env.PG_FETCH_AGENT_PORT) || PG_FETCH_AGENT_PORT;

createServer(handleRequest).listen(port, "127.0.0.1", () => {
  console.log("");
  console.log("  HomeUP PG Fetch Agent");
  console.log(`  Listening on http://127.0.0.1:${port}`);
  console.log("  Keep this window open. Use Fetch on the live admin site.");
  console.log("  Chrome will open HERE when you click Fetch.");
  console.log("");
});
