import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { I18nProvider } from '@/components/I18nProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;
  const dictionary = await getDictionary(locale);

  return (
    <I18nProvider dictionary={dictionary}>
      <Navbar locale={locale} />
      <main>{children}</main>
      <Footer />
    </I18nProvider>
  );
}
