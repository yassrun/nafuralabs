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
    slug: "brand-refresh",
    title: "Brand Refresh",
    image: "https://placehold.co/506x633/1a1a1a/ffffff?text=Project+1",
    size: "large",
    x: 48,
    y: 0,
  },
  {
    slug: "founders-launch",
    title: "Founders Launch",
    image: "https://placehold.co/409x512/2a2a2a/ffffff?text=Project+2",
    size: "medium",
    // 48 + 506 + 80
    x: 634,
    y: 168,
  },
  {
    slug: "storytelling-campaign",
    title: "Storytelling Campaign",
    image: "https://placehold.co/290x363/333333/ffffff?text=Project+3",
    size: "small",
    // 634 + 409 + 80
    x: 1123,
    y: 48,
  },
  {
    slug: "visual-identity",
    title: "Visual Identity",
    image: "https://placehold.co/409x512/2a2a2a/ffffff?text=Project+4",
    size: "medium",
    x: 88,
    y: 920,
  },
  {
    slug: "content-system",
    title: "Content System",
    image: "https://placehold.co/506x633/1a1a1a/ffffff?text=Project+5",
    size: "large",
    // 88 + 409 + 80
    x: 577,
    y: 1100,
  },
  {
    slug: "packaging",
    title: "Packaging",
    image: "https://placehold.co/290x363/333333/ffffff?text=Project+6",
    size: "small",
    // 577 + 506 + 80
    x: 1163,
    y: 1480,
  },
  {
    slug: "digital-experience",
    title: "Digital Experience",
    image: "https://placehold.co/409x512/2a2a2a/ffffff?text=Project+7",
    size: "medium",
    x: 180,
    y: 2180,
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
