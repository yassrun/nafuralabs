'use client';

interface BadgeProps {
  text: string;
  variant?: 'gold' | 'teal';
}

/** Selection chip / label — technical corners (sm), secondary container for teal */
export function Badge({ text, variant = 'gold' }: BadgeProps) {
  const styles =
    variant === 'gold'
      ? 'rounded-sm border border-accent/50 bg-accent/20 px-4 py-2 font-display text-label-md font-semibold uppercase tracking-wider text-accent'
      : 'rounded-sm bg-secondary-container px-4 py-2 font-display text-label-md font-semibold uppercase tracking-wider text-secondary-on-container';

  return (
    <span className={`inline-block ${styles}`} role="status">
      {text}
    </span>
  );
}
