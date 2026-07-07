import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const heroDir = join(__dirname, "..", "public", "hero");

const heroLines = [
  "Ideas and power",
  "branding for",
  "pioneering founders",
  "and bold marketing",
  "teams",
];

const ctaLines = [
  "Want a coffee",
  "with us?",
  "Let us",
  "talk!",
];

mkdirSync(heroDir, { recursive: true });

function handDrawnSvg(text, id, invert = false) {
  const fill = invert ? "#FFFFFF" : "#000000";
  const w = Math.max(200, text.length * 14);
  return `<svg width="${w}" height="52" viewBox="0 0 ${w} 52" xmlns="http://www.w3.org/2000/svg" role="img">
  <text x="4" y="38" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-style="italic" fill="${fill}" transform="rotate(-1 ${w / 2} 26)">${text}</text>
  <!-- TODO: Replace fragment-${id} with Figma hand-drawn export -->
</svg>`;
}

heroLines.forEach((line, i) => {
  const n = String(i + 1).padStart(2, "0");
  writeFileSync(join(heroDir, `fragment-${n}.svg`), handDrawnSvg(line, n));
});

// Extra fragments for layout variety
for (let i = heroLines.length + 1; i <= 8; i++) {
  const n = String(i).padStart(2, "0");
  writeFileSync(join(heroDir, `fragment-${n}.svg`), handDrawnSvg("…", n));
}

ctaLines.forEach((line, i) => {
  const n = String(i + 1).padStart(2, "0");
  writeFileSync(join(heroDir, `cta-${n}.svg`), handDrawnSvg(line, n, true));
});

console.log("Hero placeholder SVGs written to public/hero/");
