"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { loadScrollTrigger } from "@/lib/gsap";
import { PROJECTS } from "@/lib/projects";
import ProjectCard from "./ProjectCard";

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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
        },
      );
    })();

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, []);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative z-10 bg-transparent"
    >
      <div
        ref={cardsRef}
        className="relative mx-auto hidden min-h-[1600px] max-w-[1400px] px-6 pb-24 lg:block"
      >
        {PROJECTS.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
            layout="masonry"
          />
        ))}
      </div>

      <div className="flex flex-col gap-6 px-6 py-12 lg:hidden">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.slug} project={project} layout="stack" />
        ))}
      </div>

      <div className="flex justify-center pb-24">
        <Link
          href="/#work"
          className="flex h-[59px] w-[195px] items-center justify-center rounded-full bg-black text-[17px] font-medium text-white transition-opacity hover:opacity-80"
          data-no-draw
        >
          See more
        </Link>
      </div>
    </section>
  );
}
