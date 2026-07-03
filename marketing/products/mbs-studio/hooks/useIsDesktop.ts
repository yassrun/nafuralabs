"use client";

import { useEffect, useState } from "react";
import { useMounted } from "./useMounted";

const DESKTOP_QUERY = "(min-width: 1024px)";

export function useIsDesktop() {
  const mounted = useMounted();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mounted]);

  return mounted && isDesktop;
}
