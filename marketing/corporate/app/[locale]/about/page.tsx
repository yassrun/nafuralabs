import type { Metadata } from 'next';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { Card } from '@/components/Card';
import { Grid } from '@/components/Grid';
import { CTASection } from '@/components/CTASection';
import { Badge } from '@/components/Badge';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/paths';

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  return {
    title: dict.meta.about.title,
    description: dict.meta.about.description,
    openGraph: {
      title: dict.meta.about.title,
      description: dict.meta.about.description,
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const a = dict.about;

  return (
    <>
      <Section variant="dark" mesh className="pt-28 pb-16 lg:pt-36 lg:pb-20">
        <SectionHeading
          as="h1"
          dark
          align="center"
          title={a.hero.title}
          subtitle={a.hero.subtitle}
        />
      </Section>

      <Section variant="light" className="py-20 lg:py-28">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            {a.name.title}
          </h2>
          <p className="mt-6 text-lg text-neutral-600">{a.name.body}</p>
          <div className="mt-10 h-px bg-ghost-line" aria-hidden />
          <p className="mt-10 font-display text-2xl italic text-accent">
            {a.name.tagline}
          </p>
        </div>
      </Section>

      <Section variant="muted" className="py-20 lg:py-28">
        <SectionHeading title={a.beliefs.title} align="left" />
        <div className="mt-14">
          <Grid cols={2}>
            {a.beliefs.items.map((b, i) => (
              <Card key={b.title} delay={i * 0.05}>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500">{b.body}</p>
              </Card>
            ))}
          </Grid>
        </div>
      </Section>

      <Section variant="light" className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge text={a.positioning.badge} variant="gold" />
          <p className="mt-8 text-lg text-neutral-600">
            {a.positioning.body}
          </p>
        </div>
      </Section>

      <Section variant="muted" className="py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl font-bold text-neutral-900 lg:text-3xl">
            {a.difference.line1}
          </p>
          <p className="mt-4 font-display text-2xl font-bold text-neutral-900 lg:text-3xl">
            {a.difference.line2}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-neutral-500">
            {a.difference.body}
          </p>
        </div>
      </Section>

      <CTASection
        title={a.cta.title}
        subtitle={a.cta.subtitle}
        ctaLabel={a.cta.button}
        ctaHref={localePath(locale, '/contact')}
      />
    </>
  );
}
