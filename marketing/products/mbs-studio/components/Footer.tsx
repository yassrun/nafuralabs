"use client";

import Link from "next/link";
import { FOOTER_LOGO } from "@/lib/headerLogo";

export default function Footer() {
  return (
    <footer className="mt-auto px-[var(--layout-gutter)] pb-[clamp(28px,4vh,48px)] pt-8">
      <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <Link href="/" className="relative inline-block shrink-0" data-no-draw>
          <img
            src={FOOTER_LOGO.src}
            alt={FOOTER_LOGO.alt}
            width={FOOTER_LOGO.width}
            height={FOOTER_LOGO.height}
            className="block h-[56px] w-auto max-w-[min(70vw,260px)] object-contain object-left sm:h-[64px] lg:h-[72px]"
            draggable={false}
          />
        </Link>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16 lg:gap-20">
          <div className="flex flex-col gap-1.5 text-[15.58px] font-medium leading-snug">
            <a
              href="mailto:bigstuff@gmail.com"
              className="hover:opacity-70"
              data-no-draw
            >
              bigstuff@gmail.com
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70"
              data-no-draw
            >
              @Mr.Bigstuff Studio
            </a>
          </div>
          <div className="flex flex-col gap-1.5 text-[15.58px] font-medium leading-snug lg:text-right">
            <p>23, résidence Passadena 20000, Casablanca</p>
            <a href="tel:+212123456789" className="hover:opacity-70" data-no-draw>
              +212 123 45 678 9
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
