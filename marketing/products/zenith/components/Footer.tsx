"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto px-[var(--layout-gutter)] pb-[clamp(28px,4vh,48px)] pt-8">
      <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <Link
          href="/"
          className="relative inline-block shrink-0 text-[22px] font-medium leading-none tracking-[0.3em] text-white"
          data-no-draw
        >
          ZÉNITH
        </Link>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16 lg:gap-20">
          <div className="flex flex-col gap-1.5 text-[15.58px] font-medium leading-snug">
            <a href="mailto:contact@zenith.ma" className="hover:opacity-70" data-no-draw>
              contact@zenith.ma
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70"
              data-no-draw
            >
              @zenith.studio
            </a>
          </div>
          <div className="flex flex-col gap-1.5 text-[15.58px] font-medium leading-snug lg:text-right">
            <p>Bourgogne, Casablanca — Maroc</p>
            <a href="tel:+212000000000" className="hover:opacity-70" data-no-draw>
              +212 000 000 000
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-white/10 pt-6">
        <p className="text-[13px] font-normal tracking-[0.06em] text-white/60">
          Zénith — Une vision. Une maîtrise. Un résultat.
        </p>
      </div>
    </footer>
  );
}
