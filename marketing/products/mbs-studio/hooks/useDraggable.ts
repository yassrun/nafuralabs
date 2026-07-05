"use client";

import { useCallback, useRef, type RefObject } from "react";
import { useRouter } from "next/navigation";

const CLICK_MAX_MS = 200;
const DRAG_THRESHOLD_PX = 3;

interface UseDraggableOptions {
  enabled: boolean;
  href: string;
  boundsRef?: RefObject<HTMLElement | null>;
  cardWidth: number;
  cardHeight: number;
  bottomReserve?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useDraggable({
  enabled,
  href,
  boundsRef,
  cardWidth,
  cardHeight,
  bottomReserve = 0,
}: UseDraggableOptions) {
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

  const clampToBounds = useCallback(
    (x: number, y: number) => {
      const bounds = boundsRef?.current;
      if (!bounds) return { x, y };

      const maxX = Math.max(0, bounds.clientWidth - cardWidth);
      const maxY = Math.max(
        0,
        bounds.clientHeight - cardHeight - bottomReserve,
      );
      return {
        x: clamp(x, 0, maxX),
        y: clamp(y, 0, maxY),
      };
    },
    [boundsRef, cardWidth, cardHeight, bottomReserve],
  );

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

      const el = cardRef.current;
      if (!el) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const dist = Math.hypot(dx, dy);

      if (!state.isDragging) {
        const held = Date.now() - state.startTime > CLICK_MAX_MS;
        if (dist > DRAG_THRESHOLD_PX || held) {
          state.isDragging = true;
          state.moved = true;
          document.body.classList.add("is-dragging-card");
          el.style.transform = "none";
        }
      }

      if (!state.isDragging) return;

      const next = clampToBounds(state.originX + dx, state.originY + dy);
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
      el.style.zIndex = "50";
    },
    [clampToBounds],
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
