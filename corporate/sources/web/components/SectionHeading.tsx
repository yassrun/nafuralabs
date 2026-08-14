'use client';

import { motion } from 'framer-motion';

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  dark?: boolean;
  as?: 'h1' | 'h2';
}

export function SectionHeading({
  title,
  subtitle,
  align = 'left',
  dark = false,
  as = 'h2',
}: SectionHeadingProps) {
  const alignTitle = align === 'center' ? 'text-center' : '';
  const alignSub = align === 'center' ? 'mx-auto text-center' : '';

  const HeadingTag = as;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={alignTitle}
    >
      <HeadingTag
        className={`font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2.25rem] lg:leading-tight ${
          dark ? 'text-white' : 'text-neutral-900'
        }`}
      >
        {title}
      </HeadingTag>
      {subtitle && (
        <p
          className={`mt-4 max-w-2xl text-body-lg ${
            dark ? 'text-neutral-200' : 'text-neutral-500'
          } ${alignSub}`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
