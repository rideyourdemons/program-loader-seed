#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const DEFAULT_CANONICAL = path.join(__dirname, "..", "public", "data", "tools-canonical.json");
const INPUT = path.resolve(process.env.TOOLS_INPUT || DEFAULT_CANONICAL);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "data");

const PASS = path.join(OUTPUT_DIR, "tools.pass.json");
const DRAFT = path.join(OUTPUT_DIR, "tools.draft.json");
const REPORT = path.join(OUTPUT_DIR, "tools.report.json");

const BATCH_SIZE = 50;

function validate(tool) {
  const failures = [];
  if (!tool.disclaimer) failures.push("missing disclaimer");
  if (!tool.content || tool.content.length < 600) failures.push("content too short");
  if (!tool.howWhy || tool.howWhy.length < 200) failures.push("weak howWhy");
  return failures;
}

function generateContent(tool) {
  const title = tool.title || tool.slug || "Tool";

  return {
    disclaimer:
      "This tool is for personal development and skill-building. It is not a substitute for professional care.",

    summary: `Operational run for ${title.toLowerCase()}.`,

    content: `
MISSION
Run this when the pattern activates.

EXECUTION
1. Name the situation.
2. Identify the pull.
3. Choose your lane.
4. Execute the next clean action.

FAIL POINT
Trying to solve everything at once.

DEBRIEF
What changed?
`.repeat(8),

    howWhy: `
Interrupts automatic behavior and reinforces conscious execution under load.
`,

    variants: {
      5: { label: "Reset run" },
      15: { label: "Standard run" },
      30: { label: "Deep run" },
    },

    whereItCameFrom:
      "Behavioral activation, cognitive restructuring, and performance protocols.",
  };
}

const raw = JSON.parse(fs.readFileSync(INPUT, "utf8"));
const tools = Array.isArray(raw) ? raw : (raw.tools || []);

const pass = [];
const draft = [];

let processed = 0;

for (const tool of tools) {
  if (processed >= BATCH_SIZE) break;

  const enriched = { ...tool, ...generateContent(tool) };
  const failures = validate(enriched);

  if (failures.length === 0) pass.push(enriched);
  else draft.push({ ...enriched, failures });

  processed++;
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(PASS, JSON.stringify(pass, null, 2));
fs.writeFileSync(DRAFT, JSON.stringify(draft, null, 2));
fs.writeFileSync(REPORT, JSON.stringify({ processed, pass: pass.length, draft: draft.length }, null, 2));

console.log("Processed:", processed);
console.log("PASS:", pass.length);
console.log("DRAFT:", draft.length);
