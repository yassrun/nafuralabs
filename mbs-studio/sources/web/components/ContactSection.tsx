"use client";

import Image from "next/image";
import Footer from "./Footer";

const CTA_TEXT = {
  src: "/hero/cta-text.png",
  width: 620,
  height: 280,
};

interface ContactSectionProps {
  onBookCall: () => void;
}

export default function ContactSection({ onBookCall }: ContactSectionProps) {
  return (
    <section
      id="book"
      className="relative z-10 flex min-h-[962px] w-full flex-col bg-[#1E1E1E] text-white"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-[var(--layout-gutter)] py-20 md:py-28">
        <Image
          src={CTA_TEXT.src}
          alt=""
          width={CTA_TEXT.width}
          height={CTA_TEXT.height}
          className="h-auto w-full max-w-[min(92vw,620px)] object-contain mix-blend-screen"
          data-no-draw
          unoptimized
        />
        <p className="sr-only">Want a coffee with us? Let us talk!</p>

        <button
          type="button"
          onClick={onBookCall}
          className="mt-10 flex h-[59px] w-[195px] shrink-0 items-center justify-center rounded-full bg-white text-[17px] font-medium text-black transition-opacity hover:opacity-90 md:mt-12"
          data-no-draw
        >
          Book a call
        </button>
      </div>

      <Footer />
    </section>
  );
}
