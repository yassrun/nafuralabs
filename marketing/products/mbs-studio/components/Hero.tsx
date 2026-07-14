import Image from "next/image";
import { FIGMA_LAYOUT_WIDTH } from "@/lib/projectLayout";
import { HERO_HEADLINE } from "@/lib/heroHeadline";

/** Headline width as % of Figma 1728px frame — slightly smaller than artboard export */
const HERO_WIDTH_RATIO = (HERO_HEADLINE.width / FIGMA_LAYOUT_WIDTH) * 0.86;

export default function Hero() {
  return (
    <section className="sticky top-0 z-0 min-h-screen w-full bg-transparent">
      <div className="relative min-h-screen w-full">
        {/* Hand-drawn headline — single static image, truly centered in viewport */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-[var(--layout-gutter)]">
          <Image
            src={HERO_HEADLINE.src}
            alt={HERO_HEADLINE.alt}
            width={HERO_HEADLINE.width}
            height={HERO_HEADLINE.height}
            priority
            className="mx-auto h-auto w-full object-contain object-center select-none"
            style={{
              maxWidth: `min(${HERO_WIDTH_RATIO * 100}vw, ${Math.round(HERO_HEADLINE.width * 0.86)}px)`,
            }}
            unoptimized
            draggable={false}
          />
        </div>

        {/* Bottom captions — same left/right axis as header logo / nav */}
        <div className="pointer-events-none absolute right-[var(--layout-gutter)] bottom-[clamp(28px,4.5vh,56px)] left-[var(--layout-gutter)] flex flex-col items-stretch justify-between gap-8 md:flex-row md:items-end md:gap-4">
          <p
            className="pointer-events-auto m-0 shrink-0 p-0 text-left text-[11px] leading-none font-normal tracking-[0.06em] whitespace-nowrap text-black uppercase sm:text-[12px] md:text-[13px]"
            data-no-draw
          >
            Casablanca based. Open to the world
          </p>
          <div
            className="pointer-events-auto text-left text-[11px] leading-[1.35] font-normal tracking-[0.06em] text-black uppercase sm:text-[12px] md:ml-auto md:text-right md:text-[13px]"
            data-no-draw
          >
            <span className="block md:whitespace-nowrap">
              We connect strategy with storytelling, design,
            </span>
            <span className="block md:whitespace-nowrap">
              and content to build brands that matter.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
