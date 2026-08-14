/** Figma HOME PAGE artboard — MacBook Pro 16" frame width */
export const FIGMA_LAYOUT_WIDTH = 1728;

/** Scale layout coords/sizes to the live container width */
export function getLayoutScale(containerWidth: number): number {
  if (containerWidth <= 0) return 1;
  return Math.min(1, containerWidth / FIGMA_LAYOUT_WIDTH);
}

export function scalePx(value: number, scale: number): number {
  return Math.round(value * scale);
}
