import { requireAuth } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getTransactionCohortSummary } from "@/lib/pipeline/transactions";
import { NextResponse } from "next/server";

// ── CSV parsing ───────────────────────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  "property_type",
  "town",
  "sold_price",
  "days_on_market",
  "year",
] as const;

const OPTIONAL_COLUMNS = ["segment", "net_vs_valuation"] as const;

type CsvRow = {
  property_type: string;
  town: string;
  segment: string | null;
  sold_price: number;
  days_on_market: number;
  net_vs_valuation: number | null;
  year: number;
};

const VALID_PROPERTY_TYPES = new Set(["HDB", "Condo", "EC", "Landed"]);

function parseCsv(text: string): { rows: CsvRow[]; errors: string[] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must have a header row and at least one data row."] };
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/['"]/g, ""));

  // Validate required columns
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [`Missing required columns: ${missing.join(", ")}. Got: ${header.join(", ")}`],
    };
  }

  const idx = (col: string) => header.indexOf(col);

  const rows: CsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    // Simple split — values must not contain commas. Use TSV or quote-wrapping for complex data.
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));

    const get = (col: string) => cells[idx(col)] ?? "";

    const propertyType = get("property_type");
    const town = get("town");
    const soldPriceRaw = get("sold_price");
    const domRaw = get("days_on_market");
    const yearRaw = get("year");
    const segment = idx("segment") >= 0 ? get("segment") || null : null;
    const nvRaw = idx("net_vs_valuation") >= 0 ? get("net_vs_valuation") : "";

    // Validate
    if (!VALID_PROPERTY_TYPES.has(propertyType)) {
      errors.push(`Row ${lineNum}: property_type "${propertyType}" must be HDB, Condo, EC, or Landed.`);
      continue;
    }
    if (!town) {
      errors.push(`Row ${lineNum}: town is required.`);
      continue;
    }
    const soldPrice = parseInt(soldPriceRaw, 10);
    if (isNaN(soldPrice) || soldPrice <= 0) {
      errors.push(`Row ${lineNum}: sold_price "${soldPriceRaw}" must be a positive integer.`);
      continue;
    }
    const dom = parseInt(domRaw, 10);
    if (isNaN(dom) || dom < 0) {
      errors.push(`Row ${lineNum}: days_on_market "${domRaw}" must be a non-negative integer.`);
      continue;
    }
    const year = parseInt(yearRaw, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      errors.push(`Row ${lineNum}: year "${yearRaw}" must be a valid 4-digit year.`);
      continue;
    }

    let nv: number | null = null;
    if (nvRaw !== "" && nvRaw !== undefined) {
      nv = parseFloat(nvRaw);
      if (isNaN(nv)) {
        errors.push(`Row ${lineNum}: net_vs_valuation "${nvRaw}" must be a number or empty.`);
        continue;
      }
    }

    rows.push({ property_type: propertyType, town, segment, sold_price: soldPrice, days_on_market: dom, net_vs_valuation: nv, year });
  }

  return { rows, errors };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/** GET /api/admin/transactions — cohort summary for the admin dashboard */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const summary = await getTransactionCohortSummary();
  return NextResponse.json(summary);
}

/**
 * POST /api/admin/transactions
 * Body: multipart/form-data with field "file" = CSV
 * Accepts any valid CSV freely. min-5 privacy gate is at query time only.
 */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let text: string;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Upload a CSV file in the 'file' field." }, { status: 400 });
    }
    text = await (file as File).text();
  } catch {
    return NextResponse.json({ error: "Could not read uploaded file." }, { status: 400 });
  }

  const { rows, errors } = parseCsv(text);

  if (errors.length > 0 && rows.length === 0) {
    return NextResponse.json({ error: "CSV validation failed.", details: errors }, { status: 422 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid data rows found in CSV." }, { status: 422 });
  }

  // Insert — append mode (don't delete existing; admin can truncate via the UI if needed)
  const supabase = createServiceClient();
  const { error: dbError } = await supabase.from("transactions").insert(rows);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: rows.length,
    skippedErrors: errors.length,
    parseErrors: errors.length > 0 ? errors : undefined,
  });
}

/** DELETE /api/admin/transactions — truncate all rows (admin-only reset) */
export async function DELETE() {
  const { error } = await requireAuth();
  if (error) return error;

  const supabase = createServiceClient();
  // Delete all — Supabase requires a filter; use a tautology
  const { error: dbError } = await supabase
    .from("transactions")
    .delete()
    .gte("year", 0);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
