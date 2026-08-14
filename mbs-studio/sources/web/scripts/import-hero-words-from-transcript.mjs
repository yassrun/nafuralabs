/**
 * One-off: extract hero word SVGs from the agent transcript user message.
 * Usage: node scripts/import-hero-words-from-transcript.mjs [path-to.jsonl]
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultTranscript =
  process.env.HERO_TRANSCRIPT ||
  join(
    process.env.USERPROFILE || process.env.HOME,
    ".cursor/projects/c-Users-yassiveco-Desktop-Nafura-projets-mbs-sites-mbs-sitesmbs-studio/agent-transcripts/27aeb884-7315-4bf6-946e-66bbdba80314/27aeb884-7315-4bf6-946e-66bbdba80314.jsonl",
  );

const transcriptPath = process.argv[2] || defaultTranscript;
const outDir = join(__dirname, "..", "public", "hero", "words");

const labels = [
  ["ideas", "ideas.svg"],
  ["and", "and.svg"],
  ["power", "power.svg"],
  ["branding", "branding.svg"],
  ["for", "for.svg"],
  ["pioneering", "pioneering.svg"],
  ["founders", "founders.svg"],
  ["and", "and-2.svg"],
  ["bold", "bold.svg"],
  ["marketing", "marketing.svg"],
  ["teams", "teams.svg"],
];

function extractSvg(str, startIdx) {
  const open = str.indexOf("<svg", startIdx);
  if (open === -1) return null;
  let i = open + 4;
  let depth = 1;
  while (i < str.length) {
    const nextOpen = str.indexOf("<svg", i);
    const nextClose = str.indexOf("</svg>", i);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      i = nextClose + 6;
      if (depth === 0) return { svg: str.slice(open, i), end: i };
    }
  }
  return null;
}

const line = readFileSync(transcriptPath, "utf8")
  .split("\n")
  .find((l) => l.includes("ideas <svg"));
if (!line) {
  console.error("No hero SVG message found in transcript");
  process.exit(1);
}

const text = JSON.parse(line).message.content[0].text
  .replace(/^<user_query>\n?/, "")
  .replace(/<\/user_query>\s*$/, "");

mkdirSync(outDir, { recursive: true });

let pos = 0;
for (const [label, file] of labels) {
  const searchFrom = text.indexOf(label, pos);
  const svgStart = text.indexOf("<svg", searchFrom);
  const result = extractSvg(text, svgStart);
  if (!result) {
    console.error("Failed to extract", file);
    process.exit(1);
  }
  writeFileSync(join(outDir, file), result.svg);
  console.log("Wrote", file);
  pos = result.end;
}

console.log("Done —", labels.length, "files in", outDir);
