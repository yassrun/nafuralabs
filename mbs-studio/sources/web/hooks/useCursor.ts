"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadGsap } from "@/lib/gsap";

export type CursorMode = "pencil" | "circle" | "hidden";

/** Figma pencil asset — 79×79px @ 1728px frame, inclined ~42° */
export const PENCIL_SIZE_FIGMA = 79;

/** Tip offset for inclined pencil @ Figma size (calibrated to stroke origin) */
export const PENCIL_TIP_OFFSET_FIGMA = { x: 11, y: 66 };

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
      // quickSetter — instant property update (no tween). Ensures the pencil
      // tip stays under the drawn stroke (quickTo{duration:0} froze the cursor
      // because there's nothing to tween).
      quickToRef.current = {
        x: gsap.quickSetter(el, "x", "px") as (value: number) => void,
        y: gsap.quickSetter(el, "y", "px") as (value: number) => void,
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

  const setCursorMode = useCallback((next: CursorMode) => {
    setMode(next);
    if (next === "hidden") return;
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

  /** @deprecated prefer setCursorMode — kept for call sites */
  const setCircleMode = useCallback(
    (active: boolean) => setCursorMode(active ? "circle" : "pencil"),
    [setCursorMode],
  );

  return {
    cursorRef,
    mode,
    ready,
    setCircleMode,
    setCursorMode,
    pencil,
  };
}
