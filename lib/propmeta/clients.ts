// PropMeta · Client tracker (Phase 2.5) — mirror of the Railway dashboard/clients.js.
// Revealed-preference engine: learn a buyer's real constraints from what they reject,
// and match the profile against live PropMeta transactions.
import { pool } from "./db";

type Body = Record<string, unknown>;
const REASON_PRICE = /price|budget|expensive|afford|cost|over/i;
const num = (v: unknown) => { const n = Number(v); return (v === "" || v == null || !Number.isFinite(n)) ? null : n; };
const int = (v: unknown) => { const n = parseInt(String(v), 10); return Number.isFinite(n) ? n : null; };
const up = (v: unknown) => (v ? String(v).toUpperCase().slice(0, 8) : null);
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).slice(0, 40)).filter(Boolean)
  : (typeof v === "string" && v.trim()) ? v.split(",").map((x) => x.trim()).filter(Boolean) : [];
const money = (n: number) => { n = +n; if (!Number.isFinite(n)) return "—"; if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M"; if (Math.abs(n) >= 1e3) return "$" + Math.round(n / 1e3) + "k"; return "$" + Math.round(n); };

export async function listClients(agentSlug: string) {
  const { rows } = await pool.query(`
    select c.id, c.name, c.budget_min, c.budget_max, c.wanted_districts, c.wanted_types, c.bedrooms,
      count(*) filter (where p.status='liked')::int     as liked,
      count(*) filter (where p.status='rejected')::int  as rejected,
      count(*) filter (where p.status='shortlist')::int as shortlist
    from clients c left join client_properties p on p.client_id=c.id
    where c.agent_slug=$1 group by c.id order by c.created_at desc`, [agentSlug]);
  return rows;
}

export async function createClient(b: Body) {
  const r = await pool.query(`
    insert into clients (agent_slug,name,budget_min,budget_max,wanted_districts,wanted_types,bedrooms,notes)
    values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [String(b.agent || "").slice(0, 80), String(b.name || "Unnamed").slice(0, 120),
     num(b.budgetMin), num(b.budgetMax), arr(b.districts), arr(b.types), int(b.bedrooms), String(b.notes || "").slice(0, 2000)]);
  return { id: r.rows[0].id };
}

export async function addProperty(b: Body) {
  if (!b.clientId) throw new Error("clientId required");
  if (!["liked", "rejected", "shortlist"].includes(String(b.status))) throw new Error("bad status");
  await pool.query(`
    insert into client_properties (client_id,label,district,property_type,price,area_sqm,status,reason)
    values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [int(b.clientId), String(b.label || "").slice(0, 200), up(b.district), String(b.propertyType || "").slice(0, 60),
     num(b.price), num(b.areaSqm), b.status, String(b.reason || "").slice(0, 200)]);
  return { ok: true };
}

export async function deleteProperty(id: unknown) { await pool.query("delete from client_properties where id=$1", [int(id)]); return { ok: true }; }

export async function getClient(id: unknown) {
  const c = (await pool.query("select * from clients where id=$1", [int(id)])).rows[0];
  if (!c) throw new Error("client not found");
  const props = (await pool.query(`
    select id,label,district,property_type,price,area_sqm,status,reason,to_char(created_at,'YYYY-MM-DD') as date
    from client_properties where client_id=$1 order by created_at desc`, [int(id)])).rows;
  return { client: c, properties: props, insights: computeInsights(c, props), match: await marketMatch(c) };
}

interface Prop { status: string; price: number | null; district: string | null; reason: string | null; }
function computeInsights(c: Record<string, unknown>, props: Prop[]) {
  const liked = props.filter((p) => p.status === "liked"), rejected = props.filter((p) => p.status === "rejected"), shortlist = props.filter((p) => p.status === "shortlist");
  const signals: string[] = [];
  const budgetMax = c.budget_max ? +(c.budget_max as number) : null;
  const priceRejects = rejected.filter((p) => p.price && REASON_PRICE.test(p.reason || ""));
  const revealedCeiling = priceRejects.length ? Math.min(...priceRejects.map((p) => +(p.price as number))) : null;
  if (revealedCeiling && budgetMax && revealedCeiling < budgetMax * 0.97)
    signals.push(`💰 Real ceiling looks like ~${money(revealedCeiling)} — they reject on price below their stated ${money(budgetMax)}.`);
  const reasonCounts: Record<string, number> = {};
  rejected.forEach((p) => { const r = (p.reason || "").trim().toLowerCase(); if (r) reasonCounts[r] = (reasonCounts[r] || 0) + 1; });
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
  if (topReason && topReason[1] >= 2) signals.push(`🚫 Top dealbreaker: “${topReason[0]}” (${topReason[1]} rejections) — stop showing these.`);
  const likedDist: Record<string, number> = {};
  liked.forEach((p) => { if (p.district) likedDist[p.district] = (likedDist[p.district] || 0) + 1; });
  const wanted = (c.wanted_districts as string[]) || [];
  const drift = Object.entries(likedDist).filter(([d, n]) => n >= 2 && !wanted.includes(d)).sort((a, b) => b[1] - a[1])[0];
  if (drift) signals.push(`📍 Leans toward ${drift[0]} (liked ${drift[1]}×) though it isn’t in their stated districts — widen the search there.`);
  const lp = liked.map((p) => +(p.price as number)).filter(Boolean);
  const likedBand = lp.length ? [Math.min(...lp), Math.max(...lp)] : null;
  if (likedBand && likedBand[0] !== likedBand[1]) signals.push(`🎯 Likes cluster ${money(likedBand[0])}–${money(likedBand[1])}.`);
  if (!signals.length) signals.push("Log a few liked/rejected viewings to reveal this client’s real constraints.");
  return { liked: liked.length, rejected: rejected.length, shortlist: shortlist.length, revealedCeiling, statedCeiling: budgetMax, topReason: topReason ? topReason[0] : null, reasonCounts, likedBand, signals };
}

async function marketMatch(c: Record<string, unknown>) {
  const d = (c.wanted_districts as string[])?.length ? c.wanted_districts : null;
  const t = (c.wanted_types as string[])?.length ? c.wanted_types : null;
  const r = (await pool.query(`
    select count(*)::int n,
      round(percentile_cont(0.5) within group (order by price)) median_price,
      round(percentile_cont(0.5) within group (order by psm))   median_psm
    from transactions
    where contract_month >= (current_date - interval '12 months')
      and ($1::text[] is null or district = any($1))
      and ($2::text[] is null or property_type = any($2))
      and ($3::numeric is null or price >= $3)
      and ($4::numeric is null or price <= $4)`, [d, t, c.budget_min, c.budget_max])).rows[0];
  return r;
}
