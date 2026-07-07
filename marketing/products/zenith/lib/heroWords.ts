/**
 * Hero headline — one hand-drawn SVG per word (Figma export).
 * Files live in public/hero/words/ using the `file` names below.
 */
export interface HeroWord {
  id: string;
  /** Filename in public/hero/words/ */
  file: string;
  /** Native SVG width (display scaled via CSS) */
  width: number;
  /** Native SVG height */
  height: number;
  /** Fine-tune vertical alignment within a line (px, after scale) */
  offsetY?: number;
  /** Fine-tune horizontal gap before this word (px, after scale) */
  marginLeft?: number;
}

/** Display scale — fills ~65% viewport width like Figma prototype */
export const HERO_WORD_SCALE = 0.5;

/** Figma copy layout — 3 lines */
export const HERO_LINES: HeroWord[][] = [
  // "Ideas and power branding"
  [
    { id: "ideas", file: "ideas.svg", width: 247, height: 210 },
    { id: "and-1", file: "and.svg", width: 160, height: 127, marginLeft: 4 },
    { id: "power", file: "power.svg", width: 310, height: 197, marginLeft: 2 },
    { id: "branding", file: "branding.svg", width: 328, height: 142, marginLeft: 6, offsetY: 10 },
  ],
  // "for pioneering founders and bold"
  [
    { id: "for", file: "for.svg", width: 166, height: 212 },
    { id: "pioneering", file: "pioneering.svg", width: 464, height: 304, marginLeft: 10 },
    { id: "founders", file: "founders.svg", width: 338, height: 254, marginLeft: 6, offsetY: 6 },
    { id: "and-2", file: "and-2.svg", width: 279, height: 245, marginLeft: 4 },
    { id: "bold", file: "bold.svg", width: 248, height: 270, marginLeft: 6, offsetY: -8 },
  ],
  // "marketing teams"
  [
    { id: "marketing", file: "marketing.svg", width: 372, height: 217 },
    { id: "teams", file: "teams.svg", width: 294, height: 195, marginLeft: 10, offsetY: 6 },
  ],
];

/** Flat list (animation order left-to-right, top-to-bottom) */
export const HERO_WORDS: HeroWord[] = HERO_LINES.flat();

export const HERO_WORDS_PATH = "/hero/words";
