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

/** Pencil palette — red, green, yellow, blue only (no black). */
export const DRAW_COLORS = ["#FEED00", "#015CA4", "#FD2E00", "#52B702"];

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
    }
  }, []);

  const isIgnoredAt = useCallback(
    (x: number, y: number) => {
      const el = document.elementFromPoint(x, y);
      if (!(el instanceof Element)) return false;
      if (el.closest("canvas.draw-canvas")) return false;
      if (document.documentElement.hasAttribute("data-modal-open")) return true;
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

  /**
   * Marker-ink stamp — 4 overlapping semi-transparent dabs with random offset,
   * radius and alpha. Repeated closely along the pointer path this reproduces
   * the rough, uneven felt-pen look of the hero "Ideas…" hand-drawn phrase
   * (as opposed to a clean vector stroke with a paper-grain overlay).
   */
  const stampInk = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
    ) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalCompositeOperation = "source-over";
      const dabs = 4;
      for (let i = 0; i < dabs; i++) {
        const jx = (Math.random() - 0.5) * size * 0.55;
        const jy = (Math.random() - 0.5) * size * 0.55;
        const r = size * (0.28 + Math.random() * 0.22);
        ctx.globalAlpha = 0.18 + Math.random() * 0.28;
        ctx.beginPath();
        ctx.arc(x + jx, y + jy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    [],
  );

  const drawLine = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Slightly thicker than the previous linear stroke — stamps overlap so
      // the visible width is close to the old `getPencilLineWidth` value.
      const size = getPencilLineWidth(layoutScale) * 2.4;
      const color = strokeColor.current;

      if (!lastPoint.current) {
        stampInk(ctx, x, y, size, color);
        lastPoint.current = { x, y };
        return;
      }

      const prev = lastPoint.current;
      const dx = x - prev.x;
      const dy = y - prev.y;
      const dist = Math.hypot(dx, dy);
      // Stamp density: one dab per ~28% of the stamp size — closer = smoother,
      // wider = drier/broken-up (feel free to nudge if Amine wants more ink).
      const step = Math.max(1, size * 0.28);
      const steps = Math.max(1, Math.ceil(dist / step));

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        stampInk(ctx, prev.x + dx * t, prev.y + dy * t, size, color);
      }

      lastPoint.current = { x, y };
    },
    [layoutScale, stampInk],
  );

  useEffect(() => {
    if (!enabled) return;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || isIgnoredAt(e.clientX, e.clientY)) return;
      if (document.body.classList.contains("is-dragging-card")) return;
      isDrawing.current = true;
      lastPoint.current = null;
      pickNextColor();
      drawLine(e.clientX, e.clientY);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawing.current) return;
      if (document.body.classList.contains("is-dragging-card")) {
        isDrawing.current = false;
        lastPoint.current = null;
        return;
      }
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
  }, [enabled, resizeCanvas, isIgnoredAt, pickNextColor, drawLine]);

  return { canvasRef };
}
