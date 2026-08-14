'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface CTASectionProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
}

export function CTASection({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: CTASectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-primary py-20 lg:py-28"
    >
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl lg:leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-body-lg text-neutral-200">{subtitle}</p>
        )}
        <div className="mt-10">
          <Link
            href={ctaHref}
            className="inline-flex rounded bg-gradient-to-br from-accent to-accent-light px-6 py-3 text-sm font-semibold text-accent-foreground shadow-ambient transition hover:shadow-ambient-float hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
