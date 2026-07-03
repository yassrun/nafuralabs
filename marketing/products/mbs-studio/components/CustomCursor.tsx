"use client";

import { useEffect } from "react";
import { PENCIL_TIP_OFFSET, useCursor } from "@/hooks/useCursor";
import { useDrawing } from "@/hooks/useDrawing";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMounted } from "@/hooks/useMounted";

function PencilIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
      aria-hidden
    >
      {/* Wood body */}
      <path
        d="M6 30L20 6L28 14L14 32L6 30Z"
        fill="#C4A574"
        stroke="#1a1a1a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Lead / tip */}
      <path
        d="M6 30L4 32L6 34L10 32L6 30Z"
        fill="#1a1a1a"
        stroke="#1a1a1a"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Ferrule */}
      <path
        d="M20 6L24 2L28 6L24 10L20 6Z"
        fill="#e8e8e8"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Eraser */}
      <rect
        x="23"
        y="1"
        width="6"
        height="5"
        rx="1"
        fill="#e8a0a0"
        stroke="#1a1a1a"
        strokeWidth="1"
        transform="rotate(45 26 3.5)"
      />
      <path
        d="M14 18L22 10"
        stroke="#1a1a1a"
        strokeWidth="0.8"
        opacity="0.25"
      />
    </svg>
  );
}

export default function CustomCursor() {
  const mounted = useMounted();
  const isDesktop = useIsDesktop();
  const enabled = mounted && isDesktop;
  const { cursorRef, mode, ready, setCircleMode } = useCursor({ enabled });
  const { canvasRef } = useDrawing({ enabled });

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
      {/* Drawing layer — on top of content so strokes cover the hero image */}
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
          <PencilIcon />
        ) : (
          <div
            className="h-[72px] w-[72px] rounded-full bg-white"
            style={{
              mixBlendMode: "difference",
              marginLeft: 36 - PENCIL_TIP_OFFSET.x,
              marginTop: 36 - PENCIL_TIP_OFFSET.y,
            }}
          />
        )}
      </div>
    </>
  );
}
