/**
 * /go/whatsapp?slug=<slug>
 *
 * PUBLIC route — no admin auth. Readers click this from articles.
 * Logs a lead event to Supabase (slug + timestamp, no PII),
 * then 302-redirects to the HomeUP WhatsApp number.
 *
 * Uses the anon Supabase client (public insert allowed by RLS on lead_events).
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const WHATSAPP_URL = "https://wa.me/6580877015";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") ?? "").trim().slice(0, 200);

  // Fire-and-forget lead event — never block the redirect on a DB error
  if (slug) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const supabase = createClient(url, key);
        // insert is intentionally not awaited — redirect comes first
        supabase.from("lead_events").insert({ slug }).then(() => {});
      }
    } catch {
      // silently swallow — tracking must never block the user
    }
  }

  return NextResponse.redirect(WHATSAPP_URL, { status: 302 });
}
