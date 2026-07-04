import type { SupabaseClient } from "@supabase/supabase-js";

export const RATE_LIMITS = {
  maxPerIpHour: 5,
  maxPerPhoneDay: 2,
} as const;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfterSeconds?: number };

export async function checkIntakeRateLimit(
  supabase: SupabaseClient,
  ipHash: string | null,
  phone: string,
): Promise<RateLimitResult> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (ipHash) {
    const { count, error } = await supabase
      .from("rental_intakes")
      .select("id", { count: "exact", head: true })
      .eq("client_ip_hash", ipHash)
      .gte("created_at", hourAgo);

    if (error) {
      console.error("[intake] IP rate limit check failed:", error.message);
    } else if (count != null && count >= RATE_LIMITS.maxPerIpHour) {
      return {
        allowed: false,
        reason: "Too many submissions from your network. Please try again later.",
        retryAfterSeconds: 3600,
      };
    }
  }

  const { count: phoneCount, error: phoneError } = await supabase
    .from("rental_intakes")
    .select("id", { count: "exact", head: true })
    .eq("landlord_phone", phone)
    .gte("created_at", dayAgo);

  if (phoneError) {
    console.error("[intake] phone rate limit check failed:", phoneError.message);
  } else if (phoneCount != null && phoneCount >= RATE_LIMITS.maxPerPhoneDay) {
    return {
      allowed: false,
      reason: "This phone number was used recently. Please wait before submitting again.",
      retryAfterSeconds: 86400,
    };
  }

  return { allowed: true };
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return request.headers.get("x-real-ip")?.trim() || null;
}
