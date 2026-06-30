// PropMeta · auth (mirror of Railway dashboard/auth.js). Passcode → HMAC-signed cookie.
import crypto from "crypto";
import { pool } from "./db";

const SECRET = process.env.PROPMETA_AUTH_SECRET || process.env.PROPMETA_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD || "pm-dev-secret-change-me";
export const COOKIE = "pm_session";
const MAXAGE = 30 * 24 * 3600;

const sha256 = (s: string) => crypto.createHash("sha256").update(String(s)).digest("hex");
const b64url = (buf: Buffer | string) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlDec = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const hmac = (s: string) => b64url(crypto.createHmac("sha256", SECRET).update(s).digest());

export interface Session { slug: string; role: string; exp?: number; }

function signToken(obj: Session) { const p = b64url(JSON.stringify(obj)); return p + "." + hmac(p); }
function verifyToken(tok?: string | null): Session | null {
  if (!tok || tok.indexOf(".") < 0) return null;
  const [p, sig] = tok.split(".");
  if (hmac(p) !== sig) return null;
  try { const o = JSON.parse(b64urlDec(p)); if (o.exp && Date.now() > o.exp) return null; return o; } catch { return null; }
}
function cookieFromHeader(header: string | null, name: string): string | undefined {
  const out: Record<string, string> = {};
  (header || "").split(";").forEach((p) => { const i = p.indexOf("="); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out[name];
}

export function sessionFromRequest(req: Request): Session | null { return verifyToken(cookieFromHeader(req.headers.get("cookie"), COOKIE)); }
export async function verifyPasscode(passcode: string): Promise<Session | null> {
  const pc = String(passcode || "").trim();
  if (!pc) return null;
  const row = (await pool.query("select slug, role from agent_auth where pass_hash=$1", [sha256(pc)])).rows[0];
  return row ? { slug: row.slug, role: row.role } : null;
}
export const sessionCookieHeader = (s: Session) => `${COOKIE}=${signToken({ slug: s.slug, role: s.role, exp: Date.now() + MAXAGE * 1000 })}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAXAGE}`;
export const clearCookieHeader = () => `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
