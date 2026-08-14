"use client";

import { useEffect, useState } from "react";
import { FIGMA_LAYOUT_WIDTH, getLayoutScale } from "@/lib/projectLayout";

/** Viewport-based scale vs Figma MacBook Pro 16" frame (1728px). */
export function useLayoutScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      setScale(getLayoutScale(window.innerWidth));
    };

    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

export { FIGMA_LAYOUT_WIDTH };
