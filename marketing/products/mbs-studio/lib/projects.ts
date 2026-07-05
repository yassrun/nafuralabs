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

/** Figma HOME PAGE → SCROLL — coords at 1728px frame width */
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
    x: 1080,
    y: 56,
  },
  {
    slug: "storytelling-campaign",
    title: "Storytelling Campaign",
    image: "https://placehold.co/290x363/333333/ffffff?text=Project+3",
    size: "small",
    x: 1360,
    y: 260,
  },
  {
    slug: "visual-identity",
    title: "Visual Identity",
    image: "https://placehold.co/409x512/2a2a2a/ffffff?text=Project+4",
    size: "medium",
    x: 96,
    y: 780,
  },
  {
    slug: "content-system",
    title: "Content System",
    image: "https://placehold.co/506x633/1a1a1a/ffffff?text=Project+5",
    size: "large",
    x: 720,
    y: 940,
  },
  {
    slug: "packaging",
    title: "Packaging",
    image: "https://placehold.co/290x363/333333/ffffff?text=Project+6",
    size: "small",
    x: 1280,
    y: 1240,
  },
  {
    slug: "digital-experience",
    title: "Digital Experience",
    image: "https://placehold.co/409x512/2a2a2a/ffffff?text=Project+7",
    size: "medium",
    x: 220,
    y: 1680,
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
export const SEE_MORE_TOP_GAP = 120;

/** Keep cards out of the See more breathing room when dragging */
export const PROJECTS_DRAG_BOTTOM_RESERVE = 120;

export const PROJECTS_SECTION_BOTTOM_PAD =
  PROJECTS_DRAG_BOTTOM_RESERVE + SEE_MORE_TOP_GAP;

export function getProjectsSectionMinHeight(scale = 1): number {
  const maxBottom = Math.max(
    ...PROJECTS.map((p) => p.y + PROJECT_SIZES[p.size].height),
  );
  return Math.round((maxBottom + PROJECTS_SECTION_BOTTOM_PAD) * scale);
}
