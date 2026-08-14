'use client';

import { motion } from 'framer-motion';

export interface NumberStripProps {
  stats?: { value: string; label: string }[];
  variant?: 'light' | 'dark';
}

const defaultStats = [
  { value: '12+', label: 'Years of enterprise architecture' },
  { value: '3', label: 'Industries served' },
  { value: '5x', label: 'Faster delivery with agentic platform' },
  { value: '0', label: 'Data leaks' },
];

export function NumberStrip({
  stats,
  variant = 'light',
}: NumberStripProps) {
  const list = stats?.length ? stats : defaultStats;
  const valueColor =
    variant === 'dark' ? 'text-accent-light' : 'text-accent';
  const labelColor =
    variant === 'dark' ? 'text-neutral-400' : 'text-neutral-500';

  return (
    <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4 md:gap-4 lg:gap-8 lg:py-16">
      {list.map((stat, i) => (
        <motion.div
          key={`${stat.label}-${i}`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{
            delay: i * 0.12,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex flex-col items-center text-center md:px-4"
        >
          <span className={`font-display text-4xl font-bold ${valueColor}`}>
            {stat.value}
          </span>
          <p className={`mt-2 max-w-[11rem] text-sm ${labelColor}`}>
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
