// PropMeta dashboard queries — ported 1:1 from the Railway server.js. All aggregates are
// computed live in SQL; nothing pre-aggregated. Variable keys are whitelisted (NUM/CAT);
// every user-supplied *value* is parameterised.
import { pool } from "./db";

type Params = Record<string, string | undefined>;

const cache: Record<string, { at: number; v: unknown }> = {};
async function cached<T>(key: string, ms: number, fn: () => Promise<T>): Promise<T> {
  const c = cache[key];
  if (c && Date.now() - c.at < ms) return c.v as T;
  const v = await fn();
  cache[key] = { at: Date.now(), v };
  return v;
}

// ── Relationship / query engine variable whitelist ────────────────────────────
// lease-remaining: prefer the stored column, else parse it out of the tenure string.
const LEASE_EXPR = `coalesce(lease_remaining_yrs, case when tenure ~ 'commencing from [0-9]{4}' then (substring(tenure from 'commencing from ([0-9]{4})')::int + coalesce(substring(tenure from '([0-9]+)\\s*yr')::int,99)) - extract(year from current_date) end)`;
const FLOOR_EXPR = `case when floor_range ~ '^[0-9]' then ((split_part(floor_range,'-',1))::numeric + coalesce(nullif(split_part(floor_range,'-',2),'')::numeric,(split_part(floor_range,'-',1))::numeric))/2 end`;
const NUM: Record<string, { expr: string; label: string; money?: boolean }> = {
  price: { expr: "price", label: "Sale price ($)", money: true },
  psm: { expr: "psm", label: "Price per sqm ($)", money: true },
  area_sqm: { expr: "area_sqm", label: "Floor area (sqm)" },
  lease: { expr: LEASE_EXPR, label: "Lease remaining (yrs)" },
  floor: { expr: FLOOR_EXPR, label: "Floor level (mid)" },
  year: { expr: "extract(year from contract_month)", label: "Year of sale" },
};
const CAT: Record<string, { expr: string; label: string }> = {
  district: { expr: "district", label: "District" },
  property_type: { expr: "property_type", label: "Property type" },
  market_segment: { expr: "market_segment", label: "Region (CCR/RCR/OCR)" },
  source: { expr: "source", label: "Market (HDB / private)" },
  town: { expr: "town", label: "HDB town" },
};

// one marker per project (per street for landed), with coords + median price/$sqm
export function getMap() {
  return cached("map", 60_000, async () => {
    const { rows } = await pool.query(`
      select case when project='LANDED HOUSING DEVELOPMENT' then street else project end as label,
             district, lat, lng, count(*)::int as n,
             round(percentile_cont(0.5) within group (order by price)) as median,
             round(percentile_cont(0.5) within group (order by psm))   as psm,
             min(price) as lo, max(price) as hi,
             mode() within group (order by property_type) as type
      from transactions
      where source='private' and lat is not null and lat <> 0 and lng <> 0
      group by project, street, district, lat, lng`);
    return rows;
  });
}

// monthly median $/sqm by housing type (last 5y) — stock-style trend
export function getTrend() {
  return cached("trend", 300_000, async () => {
    const { rows } = await pool.query(`
      select to_char(contract_month,'YYYY-MM') as month,
        case when source='hdb' then 'HDB'
             when property_type='Condominium' then 'Condo'
             when property_type='Apartment' then 'Apartment'
             when property_type='Executive Condominium' then 'EC'
             when property_type in ('Terrace','Semi-detached','Detached') then 'Landed'
             when property_type in ('Strata Terrace','Strata Semi-detached','Strata Detached') then 'Cluster'
        end as grp,
        round(percentile_cont(0.5) within group (order by psm)) as psm
      from transactions
      where contract_month >= (date_trunc('month',current_date) - interval '60 months') and psm is not null
      group by month, grp having count(*) >= 4 order by month`);
    const order = ["HDB", "Condo", "Apartment", "EC", "Landed", "Cluster"];
    const months = [...new Set(rows.map((r) => r.month))].sort();
    const m: Record<string, Record<string, number>> = {};
    rows.forEach((r) => { if (r.grp) (m[r.grp] = m[r.grp] || {})[r.month] = r.psm; });
    const series: Record<string, (number | null)[]> = {};
    order.forEach((grp) => { series[grp] = months.map((mo) => (m[grp] && m[grp][mo] != null ? m[grp][mo] : null)); });
    return { months, series };
  });
}

// transaction search: filter by district / type / floor-area range → table with $/sqm
export async function getTxns(p: Params) {
  const where = ["source='private'"];
  const params: (string | number)[] = [];
  if (p.district && p.district !== "All") { params.push(p.district); where.push(`district=$${params.length}`); }
  if (p.type && p.type !== "All") { params.push(p.type); where.push(`property_type=$${params.length}`); }
  if (p.amin) { params.push(Number(p.amin)); where.push(`area_sqm>=$${params.length}`); }
  if (p.amax) { params.push(Number(p.amax)); where.push(`area_sqm<=$${params.length}`); }
  const w = where.join(" and ");
  const count = (await pool.query(`select count(*)::int as n from transactions where ${w}`, params)).rows[0].n;
  const { rows } = await pool.query(
    `select project, district, property_type as type, tenure, floor_range as floor, area_sqm as area, price, psm,
       to_char(contract_month,'YYYY-MM') as month
     from transactions where ${w} order by contract_month desc, psm desc nulls last limit 800`, params);
  return { count, rows };
}

export function getMeta() {
  return cached("meta", 60_000, async () => {
    const districts = (await pool.query(`select distinct district from transactions where source='private' and district is not null order by 1`)).rows.map((r) => r.district);
    const types = (await pool.query(`select distinct property_type from transactions where source='private' order by 1`)).rows.map((r) => r.property_type);
    const total = (await pool.query(`select count(*)::int as n from transactions`)).rows[0].n;
    const variables = {
      numeric: Object.entries(NUM).map(([key, v]) => ({ key, label: v.label, money: !!v.money })),
      categoric: Object.entries(CAT).map(([key, v]) => ({ key, label: v.label })),
    };
    return { updated: new Date().toISOString(), districts, types, total, variables };
  });
}

// Correlate two variables. numeric×numeric → scatter + Pearson r + regression + binned median.
// category×numeric → median (+IQR) per group. district/type filters hold confounders fixed.
export async function getCorrelate(p: Params) {
  const yKey = p.y || "price";
  const xKey = p.x || "area_sqm";
  const Y = NUM[yKey];
  if (!Y) throw new Error("Y must be a numeric variable");
  const where: string[] = [];
  const params: string[] = [];
  const add = (expr: string, val?: string) => { if (val && val !== "All") { params.push(val); where.push(`${expr}=$${params.length}`); } };
  add("source", p.source); add("district", p.district); add("property_type", p.type);
  const baseWhere = where.length ? where.join(" and ") : "true";

  if (CAT[xKey]) {
    const X = CAT[xKey];
    const sql = `select (${X.expr})::text as cat, count(*)::int n,
        round(percentile_cont(0.5)  within group (order by ${Y.expr})) as median,
        round(percentile_cont(0.25) within group (order by ${Y.expr})) as p25,
        round(percentile_cont(0.75) within group (order by ${Y.expr})) as p75
      from transactions
      where ${baseWhere} and (${X.expr}) is not null and (${Y.expr}) is not null
      group by 1 having count(*) >= 5 order by median desc nulls last limit 40`;
    const { rows } = await pool.query(sql, params);
    return { mode: "category", x: { key: xKey, label: X.label }, y: { key: yKey, label: Y.label, money: !!Y.money }, rows };
  }

  const X = NUM[xKey];
  if (!X) throw new Error("bad X variable");
  const inner = `select (${X.expr})::float8 as x, (${Y.expr})::float8 as y from transactions
     where ${baseWhere} and (${X.expr}) is not null and (${Y.expr}) is not null`;
  const stat = (await pool.query(
    `select corr(y,x) as pearson, regr_slope(y,x) as slope, regr_intercept(y,x) as intercept,
            regr_r2(y,x) as r2, count(*)::int n, min(x) as minx, max(x) as maxx,
            percentile_cont(0.02) within group (order by x) as xlo,
            percentile_cont(0.98) within group (order by x) as xhi,
            percentile_cont(0.02) within group (order by y) as ylo,
            percentile_cont(0.98) within group (order by y) as yhi
     from (${inner}) s`, params)).rows[0];
  if (!stat.n) return { mode: "scatter", x: { key: xKey, label: X.label, money: !!X.money }, y: { key: yKey, label: Y.label, money: !!Y.money }, stat, points: [], bins: [] };
  const points = (await pool.query(`select round(x::numeric,3) as x, round(y::numeric,2) as y from (${inner}) s order by random() limit 1500`, params)).rows;
  // bin the median line over the robust p2–p98 range so outliers don't squash it into one bucket
  const blo = stat.xlo != null ? stat.xlo : stat.minx;
  const bhi = stat.xhi != null ? stat.xhi : stat.maxx;
  let bins: unknown[] = [];
  if (blo != null && bhi != null && bhi > blo) {
    bins = (await pool.query(
      `select round(avg(x)::numeric,2) as x, round(percentile_cont(0.5) within group (order by y)::numeric) as y, count(*)::int n
       from (${inner}) s where x between $${params.length + 1} and $${params.length + 2}
       group by width_bucket(x, $${params.length + 1}, $${params.length + 2}, 12) order by 1`,
      [...params, blo, bhi])).rows;
  }
  return { mode: "scatter", x: { key: xKey, label: X.label, money: !!X.money }, y: { key: yKey, label: Y.label, money: !!Y.money }, stat, points, bins };
}

export async function getHealth() {
  const r = await pool.query("select count(*)::int as n from transactions");
  return { ok: true, db: "connected", transactions: r.rows[0].n };
}
