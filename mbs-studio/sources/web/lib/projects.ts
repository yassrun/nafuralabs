export type ProjectSize = "large" | "medium" | "small";

export interface Project {
  slug: string;
  title: string;
  image: string;
  /** Second photo on hover (Figma pair) */
  imageHover: string;
  size: ProjectSize;
  /** Position on Figma 1728px canvas (px) */
  x: number;
  y: number;
}

/**
 * Figma HOME PAGE → SCROLL @ 1728px frame width.
 *
 * Visual order (top → bottom):
 *   ENCORE (large, top-left)
 *   Oh My Bun (medium, top-right)
 *   Mik (medium, center)
 *   Porto (medium, mid-right)
 *   LOF (medium, mid-left)
 *   Trash (medium, bottom-right)
 *   Alchimies (medium, bottom-left)
 *
 * Coords measured from Figma screenshot, scaled to 1728.
 */
export const PROJECTS: Project[] = [
  {
    slug: "encore",
    title: "ENCORE",
    image: "/projects/encore.jpg",
    imageHover: "/projects/encore-hover.jpg",
    size: "large",
    x: 48,
    y: 0,
  },
  {
    slug: "oh-my-bun",
    title: "Oh My Bun",
    image: "/projects/oh-my-bun.jpg",
    imageHover: "/projects/oh-my-bun-hover.jpg",
    size: "medium",
    x: 1220,
    y: 80,
  },
  {
    slug: "mik",
    title: "Mik",
    image: "/projects/mik.jpg",
    imageHover: "/projects/mik-hover.jpg",
    size: "medium",
    x: 560,
    y: 520,
  },
  {
    slug: "porto",
    title: "Porto",
    image: "/projects/porto.jpg",
    imageHover: "/projects/porto-hover.jpg",
    size: "medium",
    x: 1220,
    y: 900,
  },
  {
    slug: "lof",
    title: "LOF",
    image: "/projects/lof.jpg",
    imageHover: "/projects/lof-hover.jpg",
    size: "medium",
    x: 100,
    y: 1180,
  },
  {
    slug: "trash",
    title: "Trash",
    image: "/projects/trash.jpg",
    imageHover: "/projects/trash-hover.jpg",
    size: "medium",
    x: 1100,
    y: 1580,
  },
  {
    slug: "alchimies",
    title: "Alchimies",
    image: "/projects/alchimies.jpg",
    imageHover: "/projects/alchimies-hover.jpg",
    size: "medium",
    x: 260,
    y: 1880,
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
