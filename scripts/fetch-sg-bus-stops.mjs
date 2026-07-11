/**
 * One-time fetch of all Singapore bus stops from OSM Overpass.
 * Run: node scripts/fetch-sg-bus-stops.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "lib", "data", "sg-bus-stops.json");

const ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Singapore bounding box
const query = `[out:json][timeout:180];
node["highway"="bus_stop"](1.15,103.60,1.48,104.10);
out body;`;

const headers = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "HomeUP/1.0 (homeup.sg; bus-stop dataset build)",
};

let elements = [];

for (const endpoint of ENDPOINTS) {
  console.log(`Trying ${endpoint}...`);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180_000);
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    if (!res.ok) {
      console.warn(`HTTP ${res.status}: ${text.slice(0, 120)}`);
      continue;
    }
    const data = JSON.parse(text);
    elements = data.elements ?? [];
    if (elements.length > 0) break;
  } catch (err) {
    console.warn(`Failed: ${err.message}`);
  }
}

if (!elements.length) {
  console.error("No bus stops returned from Overpass.");
  process.exit(1);
}

const stops = elements
  .filter((e) => e.lat != null && e.lon != null)
  .map((e) => ({
    code: e.tags?.ref ?? e.tags?.local_ref ?? null,
    name: e.tags?.name ?? e.tags?.["name:en"] ?? null,
    lat: e.lat,
    lng: e.lon,
  }))
  .sort((a, b) => String(a.code ?? "").localeCompare(String(b.code ?? ""), undefined, { numeric: true }));

writeFileSync(OUT, JSON.stringify(stops));
console.log(`Wrote ${stops.length} bus stops to ${OUT}`);
