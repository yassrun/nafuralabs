"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useRouter } from "next/navigation";

const CLICK_MAX_MS = 220;
const DRAG_THRESHOLD_PX = 4;

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
    pendingX: 0,
    pendingY: 0,
    raf: 0,
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

  const flushTransform = useCallback(() => {
    const state = dragState.current;
    state.raf = 0;
    const el = cardRef.current;
    if (!el || !state.isDragging) return;

    const dx = state.pendingX - state.originX;
    const dy = state.pendingY - state.originY;
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }, []);

  const scheduleTransform = useCallback(
    (x: number, y: number) => {
      const state = dragState.current;
      state.pendingX = x;
      state.pendingY = y;
      if (state.raf) return;
      state.raf = requestAnimationFrame(flushTransform);
    },
    [flushTransform],
  );

  const beginDrag = useCallback((el: HTMLDivElement) => {
    const state = dragState.current;
    if (state.isDragging) return;
    state.isDragging = true;
    state.moved = true;
    document.body.classList.add("is-dragging-card");
    el.style.willChange = "transform";
    el.style.zIndex = "50";
    el.style.transition = "none";
    // Drop any leftover GSAP/opacity transforms so translate stays clean
    el.style.transform = "translate3d(0,0,0)";
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || e.button !== 0) return;
      const el = cardRef.current;
      if (!el) return;

      e.stopPropagation();

      const left = parseFloat(el.style.left || "0") || 0;
      const top = parseFloat(el.style.top || "0") || 0;

      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: left,
        originY: top,
        startTime: performance.now(),
        isDragging: false,
        moved: false,
        pendingX: left,
        pendingY: top,
        raf: 0,
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

      if (!state.isDragging) {
        if (Math.hypot(dx, dy) <= DRAG_THRESHOLD_PX) return;
        beginDrag(el);
      }

      e.preventDefault();
      e.stopPropagation();

      const next = clampToBounds(state.originX + dx, state.originY + dy);
      scheduleTransform(next.x, next.y);
    },
    [beginDrag, clampToBounds, scheduleTransform],
  );

  const endPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current;
      if (state.pointerId !== e.pointerId) return;

      const el = cardRef.current;
      if (el?.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }

      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }

      document.body.classList.remove("is-dragging-card");

      const duration = performance.now() - state.startTime;
      const dist = Math.hypot(e.clientX - state.startX, e.clientY - state.startY);
      const wasDragging = state.isDragging;

      if (wasDragging && el) {
        const next = clampToBounds(state.pendingX, state.pendingY);
        el.style.left = `${next.x}px`;
        el.style.top = `${next.y}px`;
        el.style.transform = "";
        el.style.willChange = "";
        el.style.transition = "";
      }

      state.pointerId = -1;
      state.isDragging = false;

      if (!wasDragging && duration < CLICK_MAX_MS && dist < DRAG_THRESHOLD_PX) {
        router.push(href);
      }
    },
    [clampToBounds, href, router],
  );

  useEffect(() => {
    return () => {
      const state = dragState.current;
      if (state.raf) cancelAnimationFrame(state.raf);
      document.body.classList.remove("is-dragging-card");
    };
  }, []);

  return {
    cardRef,
    handlers: enabled
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp: endPointer,
          onPointerCancel: endPointer,
        }
      : {},
  };
}
