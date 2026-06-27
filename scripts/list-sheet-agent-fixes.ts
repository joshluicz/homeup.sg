/**
 * List rows skipped as agent_in_wrong_column. Run: npx tsx scripts/list-sheet-agent-fixes.ts
 */
import { readFileSync } from "fs";
import { parseCsv } from "../lib/listings/parse-csv";
import { parseListingsSheetCsv } from "../lib/listings/google-sheet-listings";

const csv = readFileSync("sheet-live.csv", "utf8");
const rows = parseCsv(csv);
const hi = rows.findIndex((r) => r.some((c) => c.trim().toLowerCase() === "prtyguru id"));
const h = rows[hi].map((c) => c.trim().toLowerCase());
const col = (n: string) => h.indexOf(n);

const parsed = parseListingsSheetCsv(csv);
const activeIds = new Set(parsed.active.map((a) => a.pg_listing_id));

const fixes: Array<{
  pg_listing_id: string;
  client: string;
  move_to_agent_b: string;
  remarks: string;
}> = [];

for (let i = hi + 1; i < rows.length; i++) {
  const row = rows[i];
  const pgId = (row[col("prtyguru id")] ?? "").trim();
  if (!pgId || activeIds.has(pgId)) continue;

  const agentB = (row[col("agent")] ?? "").trim();
  if (agentB) continue;

  const months = (row[col("months since listing")] ?? "").trim();
  const lo = (row[col("lo")] ?? "").trim();
  const remarks = (row[col("remarks")] ?? "").trim();
  const misplaced = months || lo;
  if (!misplaced) continue;

  const upper = remarks.toUpperCase();
  if (upper === "SOLD" || upper === "DELISTED") continue;
  if (upper.includes("DELISTED") && upper !== "DELISTED") continue;
  if (upper === "WILL RELIST AGAIN") continue;

  const url = (row[col("propertygutu link")] ?? row[col("propertyguru link")] ?? "").trim();
  if (!url) continue;

  fixes.push({
    pg_listing_id: pgId,
    client: (row[col("client name")] ?? "").trim().slice(0, 60),
    move_to_agent_b: misplaced,
    remarks: remarks || "(blank)",
  });
}

console.log("Active sync count:", parsed.active.length);
console.log("Sell:", parsed.sell_on_sheet, "Rent:", parsed.rent_on_sheet);
console.log("\nFix Agent column B on these rows:\n");
for (const f of fixes) {
  console.log(`  ${f.pg_listing_id}  →  put "${f.move_to_agent_b}" in Agent B`);
  console.log(`    ${f.client}`);
  console.log(`    Remarks: ${f.remarks}\n`);
}
