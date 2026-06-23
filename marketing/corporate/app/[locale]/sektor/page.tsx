import Link from 'next/link';
import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { Section } from '@/components/Section';
import { Card } from '@/components/Card';
import { Grid } from '@/components/Grid';
import { CTASection } from '@/components/CTASection';
import { SectionHeading } from '@/components/SectionHeading';
import { Badge } from '@/components/Badge';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/paths';

/** The Sektor ERP application lives on the product subdomain. */
const APP_URL = 'https://sektor.nafuralabs.com';

const moduleIcons = ['▣', '◈', '◇', '⬡', '◐', '△', '⬢', '◍', '◫'] as const;

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  return {
    title: dict.meta.sektor.title,
    description: dict.meta.sektor.description,
    alternates: { canonical: '/sektor' },
    openGraph: {
      title: dict.meta.sektor.title,
      description: dict.meta.sektor.description,
    },
  };
}

export default async function SektorPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const s = dict.sektor;

  return (
    <>
      <Hero
        badge={s.hero.badge}
        headlinePart1={s.hero.headlinePart1}
        headlinePart2={s.hero.headlinePart2}
        subtext={s.hero.subtext}
        primaryCta={{
          label: s.hero.primaryCta,
          href: localePath(locale, '/contact'),
        }}
        secondaryCta={{ label: s.hero.secondaryCta, href: APP_URL }}
      />

      {/* Trust strip — Morocco compliance */}
      <Section variant="muted" className="py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-neutral-500">
          {s.trust.map((t, i) => (
            <span key={t} className="flex items-center gap-8">
              <span>{t}</span>
              {i < s.trust.length - 1 && (
                <span className="hidden text-neutral-300 sm:inline" aria-hidden>
                  |
                </span>
              )}
            </span>
          ))}
        </div>
      </Section>

      {/* Modules */}
      <Section variant="light" className="py-20 lg:py-28">
        <SectionHeading
          title={s.modules.title}
          subtitle={s.modules.subtitle}
          align="center"
        />
        <div className="mt-14">
          <Grid cols={3}>
            {s.modules.items.map((m, i) => (
              <Card key={m.title} className="h-full">
                <span className="text-2xl text-accent" aria-hidden>
                  {moduleIcons[i]}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500">{m.description}</p>
              </Card>
            ))}
          </Grid>
        </div>
      </Section>

      {/* The loop — dark band */}
      <Section variant="dark" className="py-20 lg:py-28">
        <SectionHeading
          title={s.loop.title}
          subtitle={s.loop.subtitle}
          align="center"
          dark
        />
        <div className="mt-14 flex flex-wrap items-stretch justify-center gap-3">
          {s.loop.steps.map((step) => (
            <div
              key={step.title}
              className="min-w-[150px] max-w-[200px] flex-1 rounded bg-white/5 p-5 ring-1 ring-white/15"
            >
              <p className="font-display text-sm font-semibold text-accent-light">
                {step.title}
              </p>
              <p className="mt-2 text-sm text-neutral-200">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Morocco differentiators */}
      <Section variant="muted" className="py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading title={s.maroc.title} subtitle={s.maroc.subtitle} />
            <div className="mt-6 flex flex-wrap gap-2">
              {s.maroc.chips.map((c) => (
                <Badge key={c} text={c} variant="teal" />
              ))}
            </div>
          </div>
          <ul className="space-y-4">
            {s.maroc.points.map((p) => (
              <li key={p} className="flex gap-3 text-neutral-700">
                <span
                  className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-xs text-white"
                  aria-hidden
                >
                  ✓
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Pricing */}
      <Section variant="light" className="py-20 lg:py-28">
        <SectionHeading
          title={s.pricing.title}
          subtitle={s.pricing.subtitle}
          align="center"
        />
        <div className="mt-14">
          <Grid cols={4}>
            {s.pricing.plans.map((plan) => (
              <Card
                key={plan.name}
                className={`flex h-full flex-col ${
                  plan.popular ? 'ring-2 ring-accent' : ''
                }`}
              >
                {plan.popular && (
                  <span className="mb-3 inline-block self-start rounded-sm bg-accent/20 px-3 py-1 font-display text-label-md font-semibold uppercase tracking-wider text-accent">
                    ★
                  </span>
                )}
                <h3 className="text-lg font-semibold text-neutral-900">
                  {plan.name}
                </h3>
                <p className="mt-1 min-h-[40px] text-sm text-neutral-500">
                  {plan.who}
                </p>
                <p className="mt-4 font-display text-3xl font-bold text-neutral-900">
                  {plan.price}
                  {plan.unit && (
                    <span className="ml-1 text-sm font-normal text-neutral-500">
                      {plan.unit}
                    </span>
                  )}
                </p>
                <p className="mb-5 mt-1 text-xs text-neutral-400">
                  {plan.unit ? s.pricing.billing : ' '}
                </p>
                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex gap-2 text-sm text-neutral-600"
                    >
                      <span className="text-accent" aria-hidden>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={localePath(locale, '/contact')}
                  className={`block rounded px-4 py-2.5 text-center text-sm font-semibold transition ${
                    plan.popular
                      ? 'btn-primary-gradient'
                      : 'bg-surface-container-low text-primary ring-1 ring-ghost-line hover:bg-surface-container-lowest'
                  }`}
                >
                  {plan.cta}
                </Link>
              </Card>
            ))}
          </Grid>
          <p className="mt-8 text-center text-sm text-neutral-500">
            {s.pricing.note}
          </p>
        </div>
      </Section>

      <CTASection
        title={s.cta.title}
        subtitle={s.cta.subtitle}
        ctaLabel={s.cta.button}
        ctaHref={localePath(locale, '/contact')}
      />
    </>
  );
}
