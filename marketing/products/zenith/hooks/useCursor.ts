"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadGsap } from "@/lib/gsap";

export type CursorMode = "pencil" | "circle";

/** Figma pencil asset — 79×79px @ 1728px frame, inclined ~42° */
export const PENCIL_SIZE_FIGMA = 79;

/** Tip offset for inclined pencil @ Figma size */
export const PENCIL_TIP_OFFSET_FIGMA = { x: 11, y: 72 };

export function getScaledPencil(size = PENCIL_SIZE_FIGMA) {
  const ratio = size / PENCIL_SIZE_FIGMA;
  return {
    size,
    tipOffset: {
      x: Math.round(PENCIL_TIP_OFFSET_FIGMA.x * ratio),
      y: Math.round(PENCIL_TIP_OFFSET_FIGMA.y * ratio),
    },
  };
}

/** @deprecated use getScaledPencil — kept for imports */
export const PENCIL_SIZE = PENCIL_SIZE_FIGMA;
export const PENCIL_TIP_OFFSET = PENCIL_TIP_OFFSET_FIGMA;

interface UseCursorOptions {
  enabled: boolean;
  layoutScale?: number;
}

export function useCursor({ enabled, layoutScale = 1 }: UseCursorOptions) {
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

  const pencil = getScaledPencil(
    Math.max(56, Math.round(PENCIL_SIZE_FIGMA * layoutScale)),
  );

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      if (!quickToRef.current) return;
      quickToRef.current.x(e.clientX - pencil.tipOffset.x);
      quickToRef.current.y(e.clientY - pencil.tipOffset.y);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, pencil.tipOffset.x, pencil.tipOffset.y]);

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
    pencil,
  };
}
