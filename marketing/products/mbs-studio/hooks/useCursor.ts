"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadGsap } from "@/lib/gsap";

export type CursorMode = "pencil" | "circle";

/** Pencil tip offset from top-left of the cursor element (px) */
export const PENCIL_TIP_OFFSET = { x: 5, y: 30 };

interface UseCursorOptions {
  enabled: boolean;
}

export function useCursor({ enabled }: UseCursorOptions) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<CursorMode>("pencil");
  const quickToRef = useRef<{
    x: (value: number) => void;
    y: (value: number) => void;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !cursorRef.current) return;

    let cancelled = false;

    (async () => {
      const gsap = await loadGsap();
      if (cancelled || !cursorRef.current) return;

      const el = cursorRef.current;
      gsap.set(el, { xPercent: 0, yPercent: 0, force3D: true });
      quickToRef.current = {
        x: gsap.quickTo(el, "x", { duration: 0.1, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 0.1, ease: "power3.out" }),
      };
      setReady(true);
    })();

    return () => {
      cancelled = true;
      quickToRef.current = null;
      setReady(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      if (!quickToRef.current) return;
      quickToRef.current.x(e.clientX - PENCIL_TIP_OFFSET.x);
      quickToRef.current.y(e.clientY - PENCIL_TIP_OFFSET.y);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  const setCircleMode = useCallback((active: boolean) => {
    setMode(active ? "circle" : "pencil");
    void loadGsap().then((gsap) => {
      const el = cursorRef.current;
      if (!el) return;
      gsap.to(el, {
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
      });
    });
  }, []);

  return {
    cursorRef,
    mode,
    ready,
    setCircleMode,
  };
}
