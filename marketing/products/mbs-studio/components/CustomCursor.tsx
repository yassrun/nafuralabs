"use client";

import { useEffect } from "react";
import { useCursor } from "@/hooks/useCursor";
import { useDrawing } from "@/hooks/useDrawing";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useLayoutScale } from "@/hooks/useLayoutScale";
import { useMounted } from "@/hooks/useMounted";

export default function CustomCursor() {
  const mounted = useMounted();
  const isDesktop = useIsDesktop();
  const layoutScale = useLayoutScale();
  const enabled = mounted && isDesktop;
  const { cursorRef, mode, ready, setCircleMode, pencil } = useCursor({
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
      const onCard = Boolean(target.closest("[data-project-card]"));
      setCircleMode(onCard);
    };

    document.addEventListener("mouseover", onOver);
    return () => document.removeEventListener("mouseover", onOver);
  }, [isDesktop, setCircleMode]);

  if (!enabled) return null;

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
        className={`pointer-events-none fixed top-0 left-0 z-[200] will-change-transform ${ready ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        {mode === "pencil" ? (
          // SVG keeps Figma rotation + textured raster (PNG alone loses incline)
          <img
            src="/cursor/pencil.svg"
            alt=""
            width={pencil.size}
            height={pencil.size}
            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            draggable={false}
          />
        ) : (
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
        )}
      </div>
    </>
  );
}
