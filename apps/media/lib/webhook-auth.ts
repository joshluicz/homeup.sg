import { NextResponse } from "next/server";

export function isValidWebhookSecret(request: Request): boolean {
  const expected = process.env.MEDIA_WEBHOOK_SECRET;
  if (!expected) return false;

  const provided = request.headers.get("x-media-webhook-secret");
  return provided === expected;
}

export function webhookUnauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
