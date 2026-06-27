#!/usr/bin/env node
/**
 * Submit changed URLs to IndexNow (Bing, Yandex, Seznam, Naver).
 * Requires the key file to be live at https://homeup.sg/<key>.txt
 *
 * Usage: node scripts/submit-indexnow.mjs [url...]
 */

const HOST = "homeup.sg";
const KEY = "homeupsg2026indexnowbingyandex01";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const defaultUrls = [
  `https://${HOST}/`,
  `https://${HOST}/playbook`,
  `https://${HOST}/sell`,
  `https://${HOST}/buy`,
  `https://${HOST}/about`,
  `https://${HOST}/listings`,
  `https://${HOST}/agents`,
  `https://${HOST}/sitemap.xml`,
];

const urls = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultUrls;

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  }),
});

const text = await res.text();
if (res.ok) {
  console.log(`IndexNow OK (${res.status}): submitted ${urls.length} URL(s)`);
} else {
  console.error(`IndexNow failed (${res.status}): ${text || res.statusText}`);
  process.exit(1);
}
