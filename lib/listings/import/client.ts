import { createClient } from "@/lib/supabase/client";
import type { ListingFormData } from "@/lib/listings/types";
import type { ImportResponse } from "@/lib/listings/import/types";

type ImportPayload = {
  url?: string;
  html?: string;
  listingId: string;
};

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function isVercelHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(".vercel.app");
}

function getImportEndpoints(): string[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const endpoints: string[] = [];

  if (isLocalDevHost() || isVercelHost()) {
    endpoints.push("/api/listings/import");
  }

  if (supabaseUrl) {
    endpoints.push(`${supabaseUrl}/functions/v1/import-listing`);
  }

  if (endpoints.length === 0) {
    endpoints.push("/api/listings/import");
  }

  return endpoints;
}

async function parseImportResponse(res: Response): Promise<ImportResponse | null> {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!contentType.includes("application/json") && text.trimStart().startsWith("<")) {
    return null;
  }

  try {
    return JSON.parse(text) as ImportResponse;
  } catch {
    return null;
  }
}

export async function postListingImport(
  payload: ImportPayload,
): Promise<{ data?: Partial<ListingFormData>; warnings?: string[]; error?: string }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "You must be signed in to import listings." };
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };

  let lastError = "Import service unavailable.";

  for (const endpoint of getImportEndpoints()) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await parseImportResponse(res);

    if (!json) {
      lastError =
        "Import API returned an invalid response. If you're on the live site, the import function may need to be deployed.";
      continue;
    }

    if (!json.success) {
      return { error: json.error };
    }

    return { data: json.data, warnings: json.warnings };
  }

  return { error: lastError };
}
