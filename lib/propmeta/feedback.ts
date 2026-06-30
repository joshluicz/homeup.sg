// Agent feedback for the PropMeta dashboard — stored in the propmeta Postgres (agent_feedback).
// This is the Phase-2 feedback loop: agents tell us what functions they need, tagged by slug,
// and a feature push then "imposes" the change across every agent view (one shared dashboard).
import { pool } from "./db";

export async function insertFeedback(agentSlug: string, message: string, page?: string, userAgent?: string) {
  await pool.query(
    `insert into agent_feedback (agent_slug, message, page, user_agent) values ($1,$2,$3,$4)`,
    [agentSlug.slice(0, 80), message.slice(0, 4000), (page || "").slice(0, 300), (userAgent || "").slice(0, 300)],
  );
}

export async function listFeedback(agentSlug?: string, limit = 200) {
  const params: (string | number)[] = [];
  let where = "";
  if (agentSlug && agentSlug !== "all") { params.push(agentSlug); where = "where agent_slug=$1"; }
  params.push(limit);
  const { rows } = await pool.query(
    `select id, agent_slug, message, page, created_at from agent_feedback ${where} order by created_at desc limit $${params.length}`,
    params,
  );
  return rows;
}
