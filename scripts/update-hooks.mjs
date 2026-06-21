// Update article descriptions with Dennis-voice hooks for card display.
// node scripts/update-hooks.mjs

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// [slug, dennis-voice hook]
const HOOKS = [
  [
    "upgrade-hdb-to-condo-hybrid-method-no-absd",
    "Sell first or buy first — both have real costs. Most upgraders don't know there's a third option. Here's exactly how it works and when to use it.",
  ],
  [
    "hdb-to-condo-upgrading-mistakes-to-avoid",
    "Every HDB upgrade mistake I see is a timing mistake, not a money mistake. Here are the four I see most, and what to do instead.",
  ],
  [
    "keep-hdb-rental-income-vs-pay-absd-condo",
    "Keeping your HDB for rental income while paying ABSD on a condo sounds savvy. Run the actual numbers first.",
  ],
  [
    "income-requirements-loans-first-condo-singapore",
    "The minimum income to borrow $1 million over 30 years with no other debt is roughly $8,680 a month. Here's the maths and how to improve your position.",
  ],
  [
    "overlooked-factors-buying-condo-singapore",
    "Most first-time condo buyers plan for the down payment. Almost none of them plan for these four things.",
  ],
  [
    "private-condo-vs-hdb-first-home-singapore",
    "HDB is cheaper and heavily regulated. Private condo costs more and gives you flexibility. Here's how to weigh it before the rules make the decision for you.",
  ],
  [
    "singles-buying-first-condo-singapore-tips",
    "Singles ask 'which unit do I like?' before they've answered 'what am I actually buying this for?' Sort the second question first.",
  ],
  [
    "factors-couples-miss-first-resale-condo",
    "Most of what couples miss when buying their first resale condo isn't about the unit. It's about the paperwork and the assumptions behind it.",
  ],
  [
    "buying-first-private-property-before-35",
    "Under 35 in Singapore means no HDB, no BTO, and a tighter loan if you're buying alone. Here's what that actually means for your options.",
  ],
  [
    "buying-private-property-age-45-singapore",
    "At 45, your loan tenure shortens, your CPF retirement timeline starts mattering, and the unit you buy affects whether you can cash out comfortably later.",
  ],
  [
    "single-pr-first-property-singapore-questions",
    "Three questions every single PR asks me before buying their first property. The answers are less complicated than most agents make them sound.",
  ],
  [
    "private-condo-vs-ec-when-to-choose-condo",
    "Executive condos are 20 to 30% cheaper than private condos at launch. But they're not the better deal in every situation. Here are four cases where private wins.",
  ],
  [
    "tips-buying-older-resale-condo-singapore",
    "Older resale condos are cheaper for a reason. Here's how to tell whether you're looking at a genuine buy or a money pit.",
  ],
  [
    "new-launch-vs-resale-condo-myths",
    "Three things buyers believe about new launch vs resale that the actual data doesn't support.",
  ],
  [
    "buy-property-near-school-p1-registration",
    "Living near a popular school doesn't guarantee a P1 place. What actually decides it — and why you need to plan two years out, not two months.",
  ],
  [
    "tips-resale-condo-buyers-singapore",
    "Four things resale condo buyers consistently overlook. One of them is how to use a multi-agent listing against the seller in a negotiation.",
  ],
  [
    "investment-strategies-may-backfire-private-property",
    "Four property strategies that looked smart on paper and cost people real money. One of them now carries genuine legal risk.",
  ],
  [
    "negotiation-tips-resale-condo-buyers",
    "The seller's motivation tells you more than their asking price does. Here's how to read it before you make an offer.",
  ],
  [
    "how-to-spot-undervalued-condo-singapore",
    "Three ways to find a genuinely undervalued condo — not luck, just knowing where developers and the market leave gaps.",
  ],
  [
    "new-launch-condo-showroom-tips-singapore",
    "The showroom shows you what the developer wants you to see. Here are four things to check that they don't put on display.",
  ],
  [
    "buying-tenanted-property-singapore-checks",
    "Buying a tenanted property means inheriting the existing lease. Here's the three-step check I'd run before you commit to anything.",
  ],
];

let updated = 0;
let errors = 0;

for (const [slug, description] of HOOKS) {
  const { error } = await supabase
    .from("playbook_videos")
    .update({ description, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  if (error) {
    console.error(`❌ ${slug}: ${error.message}`);
    errors++;
  } else {
    console.log(`✅ ${slug}`);
    updated++;
  }
}

console.log(`\nDone. Updated: ${updated} | Errors: ${errors}`);
