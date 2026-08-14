'use client';

import { motion } from 'framer-motion';

type SectionVariant = 'light' | 'muted' | 'dark';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  container?: boolean;
  variant?: SectionVariant;
  /** Use with variant="dark" for hero-style mesh background */
  mesh?: boolean;
}

/** Section boundaries via tonal shifts only — no 1px “divider” borders */
const variantClass = (variant: SectionVariant | undefined, mesh: boolean) => {
  if (!variant) return '';
  if (variant === 'light') return 'bg-surface text-neutral-900';
  if (variant === 'muted') return 'bg-surface-container-low text-neutral-900';
  if (mesh) return 'hero-mesh text-white';
  return 'bg-primary text-white';
};

export function Section({
  children,
  className = '',
  id,
  container = true,
  variant,
  mesh = false,
}: SectionProps) {
  const base = variantClass(variant, mesh);
  const content = container ? (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">{children}</div>
  ) : (
    children
  );

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${base} ${className}`.trim()}
    >
      {content}
    </motion.section>
  );
}
