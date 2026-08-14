'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/paths';
import { useDictionary } from '@/components/I18nProvider';
import { useParams } from 'next/navigation';

const footerPaths = [
  { path: '/sektor', key: 'sektor' as const },
  { path: '/solutions', key: 'solutions' as const },
  { path: '/portfolio', key: 'portfolio' as const },
  { path: '/process', key: 'process' as const },
  { path: '/about', key: 'about' as const },
];

export function Footer() {
  const params = useParams();
  const locale = (params?.locale as Locale) || 'en';
  const dict = useDictionary();
  const year = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-primary"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <Link
              href={localePath(locale, '/')}
              className="inline-block transition hover:opacity-80"
            >
              <Image
                src="/logo/nafura-labs-full-white.svg"
                alt="Nafura Labs"
                width={180}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-3 text-accent italic">{dict.footer.tagline}</p>
          </div>
          <div>
            <p className="font-display text-label-md uppercase text-white/90">
              {dict.footer.explore}
            </p>
            <ul className="mt-4 space-y-3">
              {footerPaths.map(({ path, key }) => (
                <li key={path}>
                  <Link
                    href={localePath(locale, path)}
                    className="text-sm text-neutral-300 transition hover:text-accent-light"
                  >
                    {dict.nav[key]}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={localePath(locale, '/contact')}
                  className="text-sm text-neutral-300 transition hover:text-accent-light"
                >
                  {dict.footer.getStarted}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-label-md uppercase text-white/90">
              {dict.footer.getInTouch}
            </p>
            <p className="mt-4">
              <a
                href="mailto:contact@nafuralabs.com"
                className="text-sm text-neutral-300 transition hover:text-accent-light"
              >
                contact@nafuralabs.com
              </a>
            </p>
            <p className="mt-2 text-sm text-neutral-300">{dict.footer.location}</p>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 bg-primary-container/30 px-4 py-6 sm:flex-row sm:items-center sm:rounded sm:px-6">
          <p className="text-sm text-neutral-400">
            {dict.footer.copyright.replace('{year}', String(year))}
          </p>
          <a
            href="#"
            className="text-sm text-neutral-300 transition hover:text-accent-light"
          >
            {dict.footer.linkedIn}
          </a>
        </div>
      </div>
    </motion.footer>
  );
}
