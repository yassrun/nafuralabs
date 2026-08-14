'use client';

interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function Grid({
  children,
  className = '',
  cols = 3,
}: GridProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[cols];

  return (
    <div className={`grid gap-6 lg:gap-8 ${gridClass} ${className}`}>
      {children}
    </div>
  );
}
