"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const CLICK_MAX_MS = 200;
const DRAG_THRESHOLD_PX = 5;

interface UseDraggableOptions {
  enabled: boolean;
  href: string;
}

export function useDraggable({ enabled, href }: UseDraggableOptions) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    startTime: 0,
    isDragging: false,
    moved: false,
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      const el = cardRef.current;
      if (!el) return;

      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: parseFloat(el.style.left || "0") || 0,
        originY: parseFloat(el.style.top || "0") || 0,
        startTime: Date.now(),
        isDragging: false,
        moved: false,
      };

      el.setPointerCapture(e.pointerId);
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current;
      if (state.pointerId !== e.pointerId) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const dist = Math.hypot(dx, dy);

      if (!state.isDragging) {
        const held = Date.now() - state.startTime > CLICK_MAX_MS;
        if (dist > DRAG_THRESHOLD_PX || held) {
          state.isDragging = true;
          state.moved = true;
          document.body.classList.add("is-dragging-card");
        }
      }

      if (!state.isDragging) return;

      const el = cardRef.current;
      if (!el) return;

      el.style.left = `${state.originX + dx}px`;
      el.style.top = `${state.originY + dy}px`;
      el.style.zIndex = "50";
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current;
      if (state.pointerId !== e.pointerId) return;

      const el = cardRef.current;
      if (el?.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }

      document.body.classList.remove("is-dragging-card");

      const duration = Date.now() - state.startTime;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const dist = Math.hypot(dx, dy);

      if (
        !state.isDragging &&
        duration < CLICK_MAX_MS &&
        dist < DRAG_THRESHOLD_PX
      ) {
        router.push(href);
      }

      dragState.current.pointerId = -1;
    },
    [href, router],
  );

  return {
    cardRef,
    handlers: enabled
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel: onPointerUp,
        }
      : {},
  };
}
