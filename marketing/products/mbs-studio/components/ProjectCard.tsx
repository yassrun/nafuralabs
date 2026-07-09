"use client";

import Image from "next/image";
import Link from "next/link";
import type { RefObject } from "react";
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
  const base = PROJECT_SIZES[project.size];
  const width = scalePx(base.width, layoutScale);
  const height = scalePx(base.height, layoutScale);
  const href = `/projects/${project.slug}`;
  const dragEnabled = layout === "masonry" && isDesktop;
  const { cardRef, handlers } = useDraggable({
    enabled: dragEnabled,
    href,
    boundsRef,
    cardWidth: width,
    cardHeight: height,
    bottomReserve: scalePx(PROJECTS_DRAG_BOTTOM_RESERVE, layoutScale),
  });

  const image = (
    <Image
      src={project.image}
      alt={project.title}
      fill
      className="object-cover"
      sizes={`${width}px`}
      unoptimized
    />
  );

  if (layout === "stack") {
    return (
      <Link
        href={href}
        className="relative block w-full overflow-hidden bg-neutral-200"
        style={{ aspectRatio: `${base.width} / ${base.height}` }}
        data-project-card
      >
        {image}
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
      className="project-card absolute overflow-hidden bg-neutral-200 shadow-sm touch-none select-none"
      style={{ ...style, backfaceVisibility: "hidden" }}
      {...(dragEnabled ? handlers : {})}
    >
      {!dragEnabled && (
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={project.title}
          data-no-draw
        />
      )}
      <div className="relative h-full w-full">{image}</div>
    </div>
  );
}
