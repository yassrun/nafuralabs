'use client';

import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Tonal lift: highest container + ambient motion — no hard card border */
export function Card({ children, className = '', delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={`rounded bg-surface-container-highest p-6 text-neutral-900 shadow-none ring-1 ring-ghost-line transition hover:shadow-ambient ${className}`}
    >
      {children}
    </motion.div>
  );
}
