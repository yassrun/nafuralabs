/**
 * Extract hero word SVGs from wordimages.md into public/hero/words/
 * Usage: node scripts/import-hero-words.mjs [path-to-wordimages.md]
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = process.argv[2] || join(__dirname, "..", "wordimages.md");
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

const text = readFileSync(sourcePath, "utf8").trim();
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
  console.log("Wrote", file, `(${result.svg.length} bytes)`);
  pos = result.end;
}

console.log("Done —", labels.length, "files →", outDir);
