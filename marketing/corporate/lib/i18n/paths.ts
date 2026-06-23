import type { Locale } from './config';

/** Path without locale prefix, e.g. `/solutions`, `/`, `/contact` */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') return `/${locale}`;
  return `/${locale}${normalized}`;
}

/** Strip `/en` or `/fr` from pathname */
export function stripLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|fr)(?=\/|$)/, '');
  return stripped || '/';
}
