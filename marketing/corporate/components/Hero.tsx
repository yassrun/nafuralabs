'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/Badge';

export interface HeroProps {
  badge?: string;
  headlinePart1: string;
  headlinePart2: string;
  subtext: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero({
  badge,
  headlinePart1,
  headlinePart2,
  subtext,
  primaryCta,
  secondaryCta,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden hero-mesh pt-28 pb-24 lg:pt-36 lg:pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-left">
            {badge && (
              <motion.div custom={0} variants={item} initial="hidden" animate="show">
                <Badge text={badge} variant="gold" />
              </motion.div>
            )}
            <motion.h1
              custom={badge ? 1 : 0}
              variants={item}
              initial="hidden"
              animate="show"
              className="mt-6 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-display-lg"
            >
              <span className="block">{headlinePart1}</span>
              <span className="block font-bold text-accent-light">
                {headlinePart2}
              </span>
            </motion.h1>
            <motion.p
              custom={badge ? 2 : 1}
              variants={item}
              initial="hidden"
              animate="show"
              className="mt-6 max-w-xl text-body-lg text-neutral-200"
            >
              {subtext}
            </motion.p>
            <motion.div
              custom={badge ? 3 : 2}
              variants={item}
              initial="hidden"
              animate="show"
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link href={primaryCta.href} className="btn-primary-gradient-lg">
                {primaryCta.label}
                <span className="ml-1" aria-hidden>
                  →
                </span>
              </Link>
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="btn-secondary-ghost-on-dark px-1 py-2 text-body-lg"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </motion.div>
          </div>
          <div className="hidden min-h-[200px] lg:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}
