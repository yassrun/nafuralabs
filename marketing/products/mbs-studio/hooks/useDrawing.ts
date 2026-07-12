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

function loadTexturePattern(
  ctx: CanvasRenderingContext2D,
): Promise<CanvasPattern | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const pattern = ctx.createPattern(img, "repeat");
      resolve(pattern);
    };
    img.onerror = () => resolve(null);
    img.src = "/textures/paper-grain.svg";
  });
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
  const texturePattern = useRef<CanvasPattern | null>(null);

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

  const applyPencilTexture = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const pattern = texturePattern.current;
      if (!pattern) return;

      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = pattern;
      ctx.lineWidth = getPencilLineWidth(layoutScale) * 1.35;
      ctx.stroke();
      ctx.restore();
    },
    [layoutScale],
  );

  const drawLine = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const lineWidth = getPencilLineWidth(layoutScale);
      ctx.strokeStyle = strokeColor.current;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 0.9 + Math.random() * 0.08;

      if (!lastPoint.current) {
        lastPoint.current = { x, y };
        ctx.beginPath();
        ctx.moveTo(x, y);
        return;
      }

      ctx.lineTo(x, y);
      ctx.stroke();
      applyPencilTexture(ctx);
      lastPoint.current = { x, y };
    },
    [applyPencilTexture, layoutScale],
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      void loadTexturePattern(ctx).then((pattern) => {
        if (!cancelled) texturePattern.current = pattern;
      });
    }

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
      cancelled = true;
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDraw);
      window.removeEventListener("pointercancel", endDraw);
    };
  }, [enabled, layoutScale, resizeCanvas, isIgnoredAt, pickNextColor, drawLine]);

  return { canvasRef };
}
