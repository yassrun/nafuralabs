import type { Metadata } from 'next';
import { Space_Grotesk, Manrope } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { defaultLocale } from '@/lib/i18n/config';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nafuralabs.com'),
  title: 'Nafura Labs — Fluidity in Intelligence',
  description:
    "Nafura Labs builds smart enterprise software powered by its own agentic platform. Morocco's first agentic AI hub.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo/nafura-labs-icon.svg',
  },
  openGraph: {
    title: 'Nafura Labs — Fluidity in Intelligence',
    description: 'Smart enterprise software powered by agentic AI. Cloud or on-premise. Secure by design.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = headers().get('x-locale') ?? defaultLocale;

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-surface font-sans text-body-lg text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
