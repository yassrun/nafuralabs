"use client";

import { useEffect, type RefObject } from "react";
import { loadGsap } from "@/lib/gsap";

const MAGNET_RADIUS_FACTOR = 0.95;
const MAGNET_MAX_PULL = 22;

interface UseProjectMagnetOptions {
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
}

export function useProjectMagnet({
  containerRef,
  enabled,
}: UseProjectMagnetOptions) {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let raf = 0;
    let removeListener: (() => void) | null = null;

    (async () => {
      const gsap = await loadGsap();
      if (cancelled) return;

      const onMove = (e: PointerEvent) => {
        if (document.body.classList.contains("is-dragging-card")) return;
        if (document.documentElement.hasAttribute("data-modal-open")) return;

        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const layers = container.querySelectorAll<HTMLElement>(
            "[data-project-card] [data-magnet-layer]",
          );

          layers.forEach((inner) => {
            const card = inner.closest<HTMLElement>("[data-project-card]");
            if (!card || card.dataset.magnetDisabled === "true") {
              gsap.set(inner, { x: 0, y: 0 });
              return;
            }

            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.hypot(dx, dy);
            const radius =
              Math.max(rect.width, rect.height) * MAGNET_RADIUS_FACTOR;

            if (dist > 0 && dist < radius) {
              const t = 1 - dist / radius;
              const pull = t * t * MAGNET_MAX_PULL;
              const tx = (dx / dist) * pull;
              const ty = (dy / dist) * pull;
              gsap.set(inner, { x: tx, y: ty, force3D: true });
            } else {
              gsap.to(inner, {
                x: 0,
                y: 0,
                duration: 0.45,
                ease: "power3.out",
                overwrite: true,
              });
            }
          });
        });
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      removeListener = () => window.removeEventListener("pointermove", onMove);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      removeListener?.();
    };
  }, [containerRef, enabled]);
}
