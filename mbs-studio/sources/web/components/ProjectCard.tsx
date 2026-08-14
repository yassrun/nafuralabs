"use client";

import Image from "next/image";
import Link from "next/link";
import type { RefObject } from "react";
import { useState } from "react";
import { useDraggable } from "@/hooks/useDraggable";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { PROJECTS_DRAG_BOTTOM_RESERVE } from "@/lib/projects";
import { scalePx } from "@/lib/projectLayout";
import type { Project } from "@/lib/projects";
import { PROJECT_SIZES } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
  layout: "stack" | "masonry";
  boundsRef?: RefObject<HTMLDivElement | null>;
  layoutScale?: number;
}

export default function ProjectCard({
  project,
  layout,
  boundsRef,
  layoutScale = 1,
}: ProjectCardProps) {
  const isDesktop = useIsDesktop();
  const [hovered, setHovered] = useState(false);
  const base = PROJECT_SIZES[project.size];
  const width = scalePx(base.width, layoutScale);
  const height = scalePx(base.height, layoutScale);
  const href = `/projects/${project.slug}`;
  const dragEnabled = layout === "masonry" && isDesktop;
  const { cardRef } = useDraggable({
    enabled: dragEnabled,
    href,
    boundsRef,
    cardWidth: width,
    cardHeight: height,
    bottomReserve: scalePx(PROJECTS_DRAG_BOTTOM_RESERVE, layoutScale),
  });

  const showHover = hovered;

  const images = (
    <>
      <Image
        src={project.image}
        alt={project.title}
        fill
        className="pointer-events-none object-cover select-none transition-opacity duration-250 ease-out"
        style={{ opacity: showHover ? 0 : 1 }}
        sizes={`${width}px`}
        unoptimized
        draggable={false}
        priority={project.slug === "encore"}
      />
      <Image
        src={project.imageHover}
        alt=""
        fill
        className="pointer-events-none object-cover select-none transition-opacity duration-250 ease-out"
        style={{ opacity: showHover ? 1 : 0 }}
        sizes={`${width}px`}
        unoptimized
        draggable={false}
        aria-hidden
      />
    </>
  );

  const hoverProps = {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
  };

  if (layout === "stack") {
    return (
      <Link
        href={href}
        className="relative block w-full overflow-hidden bg-transparent"
        style={{ aspectRatio: `${base.width} / ${base.height}` }}
        data-project-card
        {...hoverProps}
      >
        {images}
      </Link>
    );
  }

  const style = {
    width: `${width}px`,
    height: `${height}px`,
    left: `${scalePx(project.x, layoutScale)}px`,
    top: `${scalePx(project.y, layoutScale)}px`,
  };

  return (
    <div
      ref={cardRef}
      data-project-card
      className="project-card absolute overflow-hidden touch-none select-none"
      style={{ ...style, backfaceVisibility: "hidden" }}
      {...hoverProps}
    >
      <div
        data-magnet-layer
        className="absolute inset-[-8%] will-change-transform"
      >
        <div className="pointer-events-none relative h-full w-full">
          {images}
        </div>
      </div>
    </div>
  );
}
