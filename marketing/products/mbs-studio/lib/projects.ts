export type ProjectSize = "large" | "medium" | "small";

export interface Project {
  slug: string;
  title: string;
  image: string;
  size: ProjectSize;
  /** Position on Figma 1728px canvas (px) */
  x: number;
  y: number;
}

/**
 * Figma HOME PAGE → SCROLL — coords at 1728px frame width.
 *
 * Neighbor gutters ~80px (the thin strips marked in Figma review).
 * Staggered Y. No overlaps. Outer margin ~48px.
 */
export const PROJECTS: Project[] = [
  {
    slug: "alchimies-photographiques",
    title: "Alchimies Photographiques",
    image: "/projects/01-alchimies-photographiques.jpg",
    size: "large",
    x: 48,
    y: 0,
  },
  {
    slug: "mik-made-in-korea",
    title: "MIK — Made in Korea",
    image: "/projects/02-mik-made-in-korea.jpg",
    size: "medium",
    // 48 + 506 + 80
    x: 634,
    y: 168,
  },
  {
    slug: "la-cantine-family",
    title: "La Cantine Family",
    image: "/projects/03-la-cantine-family.jpg",
    size: "small",
    // 634 + 409 + 80
    x: 1123,
    y: 48,
  },
  {
    slug: "a-casa-portuguesa",
    title: "A Casa Portuguesa",
    image: "/projects/04-a-casa-portuguesa.jpg",
    size: "medium",
    x: 88,
    y: 920,
  },
  {
    slug: "the-burger-joint",
    title: "The Burger Joint",
    image: "/projects/05-the-burger-joint.jpg",
    size: "large",
    // 88 + 409 + 80
    x: 577,
    y: 1100,
  },
  {
    slug: "oh-my-bun",
    title: "Oh My Bun!",
    image: "/projects/06-oh-my-bun.jpg",
    size: "small",
    // 577 + 506 + 80
    x: 1163,
    y: 1480,
  },
];

export const PROJECT_SIZES: Record<
  ProjectSize,
  { width: number; height: number }
> = {
  large: { width: 506, height: 633 },
  medium: { width: 409, height: 512 },
  small: { width: 290, height: 363 },
};

/** Space below lowest card for See more (Figma canvas px) */
export const SEE_MORE_TOP_GAP = 140;

/** Keep cards out of the See more breathing room when dragging */
export const PROJECTS_DRAG_BOTTOM_RESERVE = 140;

export const PROJECTS_SECTION_BOTTOM_PAD =
  PROJECTS_DRAG_BOTTOM_RESERVE + SEE_MORE_TOP_GAP;

export function getProjectsSectionMinHeight(scale = 1): number {
  const maxBottom = Math.max(
    ...PROJECTS.map((p) => p.y + PROJECT_SIZES[p.size].height),
  );
  return Math.round((maxBottom + PROJECTS_SECTION_BOTTOM_PAD) * scale);
}
