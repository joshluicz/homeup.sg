import { createHmac, randomBytes, timingSafeEqual, createHash } from "crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const MIN_FORM_AGE_MS = 5 * 1000; // 5 seconds — blocks instant bot POSTs

type TokenPayload = {
  iat: number;
  exp: number;
  n: string;
};

function getSecret(): string {
  const secret = process.env.INTAKE_FORM_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("INTAKE_FORM_SECRET must be set (min 16 characters)");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodePayload(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): TokenPayload | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
}

export function createFormToken(): { token: string; issuedAt: number } {
  const iat = Date.now();
  const payload: TokenPayload = {
    iat,
    exp: iat + TOKEN_TTL_MS,
    n: randomBytes(12).toString("hex"),
  };
  const encoded = encodePayload(payload);
  const signature = sign(encoded);
  return { token: `${encoded}.${signature}`, issuedAt: iat };
}

export function verifyFormToken(token: string): { ok: true } | { ok: false; reason: string } {
  try {
    const secret = process.env.INTAKE_FORM_SECRET;
    if (!secret || secret.length < 16) {
      return { ok: false, reason: "Form verification unavailable" };
    }

    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) {
      return { ok: false, reason: "Invalid form token" };
    }

    const expected = sign(encoded);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return { ok: false, reason: "Invalid form token" };
    }

    const payload = decodePayload(encoded);
    if (!payload) {
      return { ok: false, reason: "Invalid form token" };
    }

    const now = Date.now();
    if (now > payload.exp) {
      return { ok: false, reason: "Form session expired — please refresh and try again" };
    }
    if (now - payload.iat < MIN_FORM_AGE_MS) {
      return { ok: false, reason: "Please take a moment to complete the form" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "Invalid form token" };
  }
}

export function hashClientIp(ip: string): string {
  const secret = process.env.INTAKE_FORM_SECRET ?? "fallback";
  return createHash("sha256").update(`${secret}:ip:${ip}`).digest("hex");
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}
