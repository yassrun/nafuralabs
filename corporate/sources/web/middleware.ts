import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, isLocale } from '@/lib/i18n/config';

function pickLocaleFromAcceptLanguage(header: string | null): string {
  if (!header) return defaultLocale;
  const first = header.split(',')[0]?.trim().toLowerCase() ?? '';
  if (first.startsWith('fr')) return 'fr';
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (first && isLocale(first)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', first);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const locale =
    pathname === '/'
      ? pickLocaleFromAcceptLanguage(request.headers.get('accept-language'))
      : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === '/' ? `/${locale}` : `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
