export type ProjectSize = "large" | "medium" | "small";

export interface Project {
  slug: string;
  title: string;
  image: string;
  size: ProjectSize;
  /** Initial offset from layout origin (px) — organic masonry placement */
  x: number;
  y: number;
}

export const PROJECTS: Project[] = [
  {
    slug: "brand-refresh",
    title: "Brand Refresh",
    image: "https://placehold.co/506x633/1a1a1a/ffffff?text=Project+1",
    size: "large",
    x: 80,
    y: 0,
  },
  {
    slug: "founders-launch",
    title: "Founders Launch",
    image: "https://placehold.co/409x512/2a2a2a/ffffff?text=Project+2",
    size: "medium",
    x: 620,
    y: 40,
  },
  {
    slug: "storytelling-campaign",
    title: "Storytelling Campaign",
    image: "https://placehold.co/290x363/333333/ffffff?text=Project+3",
    size: "small",
    x: 1050,
    y: 120,
  },
  {
    slug: "visual-identity",
    title: "Visual Identity",
    image: "https://placehold.co/409x512/2a2a2a/ffffff?text=Project+4",
    size: "medium",
    x: 200,
    y: 680,
  },
  {
    slug: "content-system",
    title: "Content System",
    image: "https://placehold.co/506x633/1a1a1a/ffffff?text=Project+5",
    size: "large",
    x: 680,
    y: 580,
  },
  {
    slug: "packaging",
    title: "Packaging",
    image: "https://placehold.co/290x363/333333/ffffff?text=Project+6",
    size: "small",
    x: 1180,
    y: 520,
  },
  {
    slug: "digital-experience",
    title: "Digital Experience",
    image: "https://placehold.co/409x512/2a2a2a/ffffff?text=Project+7",
    size: "medium",
    x: 420,
    y: 1180,
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
