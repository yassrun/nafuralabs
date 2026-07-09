"use client";

import { useEffect } from "react";
import { useCursor } from "@/hooks/useCursor";
import { useDrawing } from "@/hooks/useDrawing";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useLayoutScale } from "@/hooks/useLayoutScale";
import { useMounted } from "@/hooks/useMounted";
import { NATIVE_CURSOR_SELECTOR } from "@/lib/cursorZones";

export default function CustomCursor() {
  const mounted = useMounted();
  const isDesktop = useIsDesktop();
  const layoutScale = useLayoutScale();
  const enabled = mounted && isDesktop;
  const { cursorRef, mode, ready, setCursorMode, pencil } = useCursor({
    enabled,
    layoutScale,
  });
  const { canvasRef } = useDrawing({ enabled, layoutScale });

  useEffect(() => {
    if (!mounted) return;
    document.body.classList.toggle("has-custom-cursor", isDesktop && ready);
    return () => document.body.classList.remove("has-custom-cursor");
  }, [mounted, isDesktop, ready]);

  useEffect(() => {
    if (!isDesktop) return;

    const onOver = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      // Cards: circle cursor (draw is disabled, drag uses the circle).
      if (target.closest("[data-project-card]")) {
        setCursorMode("circle");
        return;
      }
      // Links, buttons, forms, chrome — native pointer/text only.
      if (target.closest(NATIVE_CURSOR_SELECTOR)) {
        setCursorMode("hidden");
        return;
      }
      setCursorMode("pencil");
    };

    document.addEventListener("mouseover", onOver);
    return () => document.removeEventListener("mouseover", onOver);
  }, [isDesktop, setCursorMode]);

  if (!enabled) return null;

  const showCustom = ready && mode !== "hidden";

  return (
    <>
      {/* Drawing layer — behind page content (z-index in globals.css) */}
      <canvas
        ref={canvasRef}
        className="draw-canvas pointer-events-none fixed inset-0"
        aria-hidden
      />
      <div
        ref={cursorRef}
        className={`pointer-events-none fixed top-0 left-0 z-[200] will-change-transform ${showCustom ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        {mode === "circle" ? (
          <div
            className="rounded-full bg-white"
            style={{
              width: Math.round(72 * layoutScale),
              height: Math.round(72 * layoutScale),
              mixBlendMode: "difference",
              marginLeft: pencil.size / 2 - pencil.tipOffset.x,
              marginTop: pencil.size / 2 - pencil.tipOffset.y,
            }}
          />
        ) : mode === "pencil" ? (
          // SVG keeps Figma rotation + textured raster (PNG alone loses incline)
          <img
            src="/cursor/pencil.svg"
            alt=""
            width={pencil.size}
            height={pencil.size}
            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            draggable={false}
          />
        ) : null}
      </div>
    </>
  );
}
