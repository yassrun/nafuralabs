import Link from 'next/link';
import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { Grid } from '@/components/Grid';
import { CTASection } from '@/components/CTASection';
import { NumberStrip } from '@/components/NumberStrip';
import { SectionHeading } from '@/components/SectionHeading';
import { Badge } from '@/components/Badge';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/paths';

const productIcons = ['▣', '◈', '◇', '⬡'] as const;

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  return {
    title: dict.meta.home.title,
    description: dict.meta.home.description,
    openGraph: {
      title: dict.meta.home.title,
      description: dict.meta.home.description,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const h = dict.home;

  return (
    <>
      <Hero
        badge={h.hero.badge}
        headlinePart1={h.hero.headlinePart1}
        headlinePart2={h.hero.headlinePart2}
        subtext={h.hero.subtext}
        primaryCta={{
          label: h.hero.primaryCta,
          href: localePath(locale, '/solutions'),
        }}
        secondaryCta={{
          label: h.hero.secondaryCta,
          href: localePath(locale, '/contact'),
        }}
      />

      <Section variant="muted" className="py-0">
        <NumberStrip stats={h.stats} />
      </Section>

      <Section variant="light" className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {h.statement.title}
          </h2>
          <p className="mt-6 text-lg text-neutral-600">{h.statement.body}</p>
        </div>
      </Section>

      <Section variant="muted" className="py-20 lg:py-28">
        <SectionHeading
          title={h.products.title}
          subtitle={h.products.subtitle}
          align="center"
        />
        <div className="mt-14">
          <Grid cols={2}>
            {h.products.items.map((item, i) => (
              <Link
                key={item.title}
                href={localePath(locale, i === 0 ? '/sektor' : '/solutions')}
                className="block h-full"
              >
                <Card className="h-full">
                  <span className="text-2xl text-accent" aria-hidden>
                    {productIcons[i]}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    {item.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge text={item.tag} variant="teal" />
                    {item.soon && (
                      <span className="text-sm italic text-neutral-400">
                        {dict.common.comingSoon}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </Grid>
        </div>
      </Section>

      <Section variant="light" className="py-20 lg:py-28">
        <SectionHeading
          title={h.services.title}
          subtitle={h.services.subtitle}
          align="center"
        />
        <div className="mt-14">
          <Grid cols={4}>
            {h.services.items.map((item) => (
              <Link
                key={item.title}
                href={`${localePath(locale, '/solutions')}#services`}
                className="block h-full"
              >
                <Card className="h-full">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    {item.description}
                  </p>
                </Card>
              </Link>
            ))}
          </Grid>
        </div>
      </Section>

      <Section variant="muted" className="py-16 lg:py-20">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-neutral-500">
          {h.credibility.label}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-medium text-neutral-400">
          <span>Société Générale</span>
          <span className="hidden sm:inline" aria-hidden>
            |
          </span>
          <span>BPI France</span>
          <span className="hidden sm:inline" aria-hidden>
            |
          </span>
          <span>Monetici</span>
        </div>
      </Section>

      <CTASection
        title={h.cta.title}
        subtitle={h.cta.subtitle}
        ctaLabel={h.cta.button}
        ctaHref={localePath(locale, '/contact')}
      />
    </>
  );
}
