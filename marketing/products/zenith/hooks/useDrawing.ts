"use client";

import { useCallback, useEffect, useRef } from "react";
import { HERO_HEADLINE } from "@/lib/heroHeadline";

/** Elements where drawing must not start (clicks pass through to UI). */
export const DRAW_IGNORE_SELECTOR = [
  "[data-no-draw]",
  "[data-project-card]",
  "header",
  "nav",
  "footer",
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "dialog",
].join(", ");

/** Pencil palette — 1st stroke black, then a visible color on each new stroke. */
export const DRAW_COLORS = [
  "#000000",
  "#FEED00",
  "#015CA4",
  "#FD2E00",
  "#52B702",
];

/** Match pencil weight to hero hand-drawn stroke (~0.38% of scaled headline width). */
export function getPencilLineWidth(layoutScale = 1) {
  const headlineWidth = HERO_HEADLINE.width * layoutScale;
  return Math.max(2, Math.min(5, headlineWidth * 0.0038));
}

interface UseDrawingOptions {
  enabled: boolean;
  ignoreSelector?: string;
  layoutScale?: number;
}

export function useDrawing({
  enabled,
  ignoreSelector = DRAW_IGNORE_SELECTOR,
  layoutScale = 1,
}: UseDrawingOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const colorIndex = useRef(0);
  const strokeColor = useRef(DRAW_COLORS[0]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = getPencilLineWidth(layoutScale);
    }
  }, [layoutScale]);

  const isIgnoredAt = useCallback(
    (x: number, y: number) => {
      const el = document.elementFromPoint(x, y);
      if (!(el instanceof Element)) return false;
      if (el.closest("canvas.draw-canvas")) return false;
      return Boolean(el.closest(ignoreSelector));
    },
    [ignoreSelector],
  );

  const pickNextColor = useCallback(() => {
    const color = DRAW_COLORS[colorIndex.current % DRAW_COLORS.length];
    colorIndex.current += 1;
    strokeColor.current = color;
    return color;
  }, []);

  const drawLine = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = strokeColor.current;
    ctx.lineWidth = getPencilLineWidth(layoutScale);

    if (!lastPoint.current) {
      lastPoint.current = { x, y };
      ctx.beginPath();
      ctx.moveTo(x, y);
      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    lastPoint.current = { x, y };
  }, [layoutScale]);

  useEffect(() => {
    if (!enabled) return;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || isIgnoredAt(e.clientX, e.clientY)) return;
      isDrawing.current = true;
      lastPoint.current = null;
      pickNextColor();
      drawLine(e.clientX, e.clientY);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawing.current) return;
      drawLine(e.clientX, e.clientY);
    };

    const endDraw = () => {
      isDrawing.current = false;
      lastPoint.current = null;
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDraw);
    window.addEventListener("pointercancel", endDraw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDraw);
      window.removeEventListener("pointercancel", endDraw);
    };
  }, [enabled, layoutScale, resizeCanvas, isIgnoredAt, pickNextColor, drawLine]);

  return { canvasRef };
}
