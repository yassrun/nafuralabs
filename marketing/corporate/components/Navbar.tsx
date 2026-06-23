'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/paths';
import { useDictionary } from '@/components/I18nProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const navPaths = [
  { path: '/sektor', key: 'sektor' as const },
  { path: '/solutions', key: 'solutions' as const },
  { path: '/portfolio', key: 'portfolio' as const },
  { path: '/process', key: 'process' as const },
  { path: '/about', key: 'about' as const },
];

export function Navbar({ locale }: { locale: Locale }) {
  const dict = useDictionary();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(hrefPath: string) {
    const full = localePath(locale, hrefPath);
    if (pathname === full) return true;
    if (hrefPath !== '/' && pathname.startsWith(`${full}/`)) return true;
    return false;
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`sticky top-0 z-50 glass-nav transition-shadow ${
        scrolled ? 'shadow-ambient' : ''
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href={localePath(locale, '/')}
          className="transition hover:opacity-80"
        >
          <Image
            src="/logo/nafura-labs-full.svg"
            alt="Nafura Labs"
            width={160}
            height={40}
            priority
            className="h-8 w-auto lg:h-10"
          />
        </Link>

        <ul className="hidden items-center gap-2 md:flex">
          {navPaths.map(({ path, key }) => {
            const active = isActive(path);
            return (
              <li key={path}>
                <Link
                  href={localePath(locale, path)}
                  className={`relative block py-2 pl-3 pr-2 text-sm transition ${
                    active
                      ? 'font-semibold text-primary'
                      : 'text-neutral-600 hover:text-primary'
                  }`}
                >
                  {active && (
                    <span
                      className="absolute bottom-1 left-0 top-1 w-0.5 rounded-full bg-accent"
                      aria-hidden
                    />
                  )}
                  {dict.nav[key]}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher locale={locale} />
          <Link
            href={localePath(locale, '/contact')}
            className="btn-primary-gradient px-5 py-2.5"
          >
            {dict.nav.getStarted}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher locale={locale} />
          <button
            type="button"
            className="btn-secondary-ghost inline-flex h-10 w-10 items-center justify-center text-neutral-700"
            aria-expanded={open}
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{dict.nav.menu}</span>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass-nav shadow-ambient md:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 py-4">
              {navPaths.map(({ path, key }) => {
                const active = isActive(path);
                return (
                  <li key={path}>
                    <Link
                      href={localePath(locale, path)}
                      className={`relative block rounded py-2.5 pl-3 pr-3 text-sm ${
                        active
                          ? 'bg-surface-container-low font-semibold text-primary'
                          : 'text-neutral-600 hover:bg-surface-container-lowest hover:text-primary'
                      }`}
                    >
                      {active && (
                        <span
                          className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-accent"
                          aria-hidden
                        />
                      )}
                      {dict.nav[key]}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-2">
                <Link
                  href={localePath(locale, '/contact')}
                  className="btn-primary-gradient block w-full py-2.5 text-center"
                >
                  {dict.nav.getStarted}
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
