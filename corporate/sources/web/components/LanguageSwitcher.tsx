'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import { localePath, stripLocale } from '@/lib/i18n/paths';

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const rest = stripLocale(pathname);
  const target: Locale = locale === 'en' ? 'fr' : 'en';
  const href = localePath(target, rest);

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      className="rounded border border-ghost-line-strong bg-transparent px-2.5 py-1 font-display text-label-md uppercase text-neutral-600 transition hover:border-primary/40 hover:text-primary"
      prefetch={false}
    >
      {target === 'fr' ? 'FR' : 'EN'}
    </Link>
  );
}
