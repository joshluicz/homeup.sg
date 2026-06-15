import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { runListingImport } from "../_shared/run-import.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey || !authHeader) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  let body: { url?: string; html?: string; listingId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  const result = await runListingImport(supabase, {
    url: body.url,
    html: body.html,
    listingId: body.listingId ?? "",
  });

  if (!result.success && result.error === "FETCH_BLOCKED") {
    return jsonResponse(result, 422);
  }

  if (!result.success) {
    return jsonResponse(result, 400);
  }

  return jsonResponse(result, 200);
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
