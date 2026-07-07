"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { loadScrollTrigger } from "@/lib/gsap";
import { FIGMA_LAYOUT_WIDTH, scalePx } from "@/lib/projectLayout";
import {
  getProjectsSectionMinHeight,
  PROJECTS,
  SEE_MORE_TOP_GAP,
} from "@/lib/projects";
import { useLayoutScale } from "@/hooks/useLayoutScale";
import ProjectCard from "./ProjectCard";

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const layoutScale = useLayoutScale();

  const sectionMinHeight = getProjectsSectionMinHeight(layoutScale);

  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current?.querySelectorAll(".project-card");
    if (!section || !cards?.length) return;

    let tween: { kill: () => void; scrollTrigger?: { kill: () => void } } | null =
      null;
    let cancelled = false;

    (async () => {
      const { gsap } = await loadScrollTrigger();
      if (cancelled) return;

      tween = gsap.fromTo(
        cards,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
          onComplete: () => {
            gsap.set(cards, { clearProps: "transform" });
          },
        },
      );
    })();

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, [layoutScale]);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-transparent"
    >
      <div
        ref={cardsRef}
        className="relative mx-auto hidden w-full overflow-hidden lg:block"
        style={{
          maxWidth: `${FIGMA_LAYOUT_WIDTH}px`,
          minHeight: `${sectionMinHeight}px`,
        }}
      >
        {PROJECTS.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
            layout="masonry"
            boundsRef={cardsRef}
            layoutScale={layoutScale}
          />
        ))}
      </div>

      <div className="flex flex-col gap-6 px-6 py-12 lg:hidden">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.slug} project={project} layout="stack" />
        ))}
      </div>

      <div
        className="flex justify-center pb-24"
        style={{ marginTop: `${scalePx(SEE_MORE_TOP_GAP, layoutScale)}px` }}
      >
        <Link
          href="/#work"
          className="flex h-[59px] w-[195px] items-center justify-center rounded-full bg-black text-[17px] font-medium text-white transition-opacity hover:opacity-80"
          data-no-draw
        >
          Voir plus
        </Link>
      </div>
    </section>
  );
}
