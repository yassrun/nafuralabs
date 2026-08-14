"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import BookACallModal from "@/components/BookACallModal";
import ContactSection from "@/components/ContactSection";
import Header from "@/components/Header";
import Hero from "@/components/Hero";

const ProjectsSection = dynamic(() => import("@/components/ProjectsSection"), {
  ssr: false,
  loading: () => (
    <section id="work" className="relative z-10 min-h-[40vh] bg-transparent" />
  ),
});

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Header onBookCall={() => setModalOpen(true)} />
      <main className="page-content relative z-10">
        <Hero />
        <ProjectsSection />
        <ContactSection onBookCall={() => setModalOpen(true)} />
      </main>
      <BookACallModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
