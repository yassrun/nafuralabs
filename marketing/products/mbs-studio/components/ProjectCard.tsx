"use client";

import Image from "next/image";
import Link from "next/link";
import { useDraggable } from "@/hooks/useDraggable";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { Project } from "@/lib/projects";
import { PROJECT_SIZES } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
  /** stack = mobile column; masonry = desktop absolute layout */
  layout: "stack" | "masonry";
}

export default function ProjectCard({ project, layout }: ProjectCardProps) {
  const isDesktop = useIsDesktop();
  const { width, height } = PROJECT_SIZES[project.size];
  const href = `/projects/${project.slug}`;
  const dragEnabled = layout === "masonry" && isDesktop;
  const { cardRef, handlers } = useDraggable({
    enabled: dragEnabled,
    href,
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
        style={{ aspectRatio: `${width} / ${height}` }}
        data-project-card
      >
        {image}
      </Link>
    );
  }

  const style = {
    width: `${width}px`,
    height: `${height}px`,
    left: `${project.x}px`,
    top: `${project.y}px`,
  };

  return (
    <div
      ref={cardRef}
      data-project-card
      className="project-card absolute overflow-hidden bg-neutral-200 shadow-sm touch-none"
      style={style}
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
