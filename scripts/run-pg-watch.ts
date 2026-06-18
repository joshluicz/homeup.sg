/**
 * Run pg automation on an interval (default every 6 hours).
 *
 *   npm run pg:watch
 *   PG_SYNC_INTERVAL_HOURS=12 npm run pg:watch
 */
import { runPgAutomation } from "./run-pg-automation";

const hours = Number(process.env.PG_SYNC_INTERVAL_HOURS ?? "6");
const intervalMs = Math.max(1, hours) * 60 * 60 * 1000;

async function tick() {
  console.log(`\n${"=".repeat(60)}`);
  try {
    await runPgAutomation();
  } catch (err) {
    console.error(err);
  }
  console.log(`Next run in ${hours} hour(s)…\n`);
}

console.log(`HomeUP listings watch — every ${hours} hour(s). Ctrl+C to stop.`);

await tick();
setInterval(() => void tick(), intervalMs);
