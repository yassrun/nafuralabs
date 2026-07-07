"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "Studio", href: "#work" },
  { label: "Approche", href: "#about" },
  { label: "Réalisations", href: "#work" },
  { label: "Prendre rendez-vous", href: "#book" },
];

interface HeaderProps {
  onBookCall: () => void;
}

export default function Header({ onBookCall }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [overDarkSection, setOverDarkSection] = useState(false);

  useEffect(() => {
    const book = document.getElementById("book");
    if (!book) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOverDarkSection(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(book);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed top-0 z-50 h-[var(--header-h)] w-full bg-transparent">
      <div className="flex h-full w-full items-center justify-between px-[var(--layout-gutter)]">
        <div
          className={`relative shrink-0 transition-opacity duration-300 ${overDarkSection ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          <Link
            href="/"
            className="relative block text-[20px] font-medium leading-none tracking-[0.28em] text-black md:text-[22px]"
            data-no-draw
          >
            ZÉNITH
          </Link>
        </div>

        <nav className="hidden items-center gap-10 lg:flex xl:gap-12">
          {NAV_LINKS.map((link) =>
            link.label === "Prendre rendez-vous" ? (
              <button
                key={link.label}
                type="button"
                onClick={onBookCall}
                className="text-[16px] font-normal text-black transition-opacity hover:opacity-60"
                data-no-draw
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-[16px] font-normal text-black transition-opacity hover:opacity-60"
                data-no-draw
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          data-no-draw
        >
          <span className="block h-0.5 w-6 bg-black" />
          <span className="block h-0.5 w-6 bg-black" />
          <span className="block h-0.5 w-4 bg-black" />
        </button>
      </div>

      {menuOpen && (
        <nav
          className="bg-paper-solid absolute top-[71px] right-0 left-0 flex flex-col gap-4 border-t border-black/10 px-6 py-6 lg:hidden"
          data-no-draw
        >
          {NAV_LINKS.map((link) =>
            link.label === "Prendre rendez-vous" ? (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onBookCall();
                }}
                className="text-left text-[16px] text-black"
                data-no-draw
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-[16px] text-black"
                onClick={() => setMenuOpen(false)}
                data-no-draw
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
