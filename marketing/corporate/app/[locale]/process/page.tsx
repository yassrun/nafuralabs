import type { Metadata } from 'next';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { CTASection } from '@/components/CTASection';
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
    title: dict.meta.process.title,
    description: dict.meta.process.description,
    openGraph: {
      title: dict.meta.process.title,
      description: dict.meta.process.description,
    },
  };
}

export default async function ProcessPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const p = dict.process;

  return (
    <>
      <Section variant="dark" mesh className="pt-28 pb-16 lg:pt-36 lg:pb-20">
        <SectionHeading
          as="h1"
          dark
          align="center"
          title={p.hero.title}
          subtitle={p.hero.subtitle}
        />
      </Section>

      <div className="space-y-0">
        {p.phases.map((phase, i) => (
          <Section
            key={phase.num}
            variant={i % 2 === 0 ? 'light' : 'muted'}
            className="py-14 lg:py-20"
          >
            <div className="grid items-start gap-10 border-l-2 border-ghost-line pl-8 lg:grid-cols-12 lg:gap-12 lg:pl-10">
              <div className="relative lg:col-span-4">
                <p
                  className="font-display text-6xl font-bold text-accent opacity-30 select-none"
                  aria-hidden
                >
                  {phase.num}
                </p>
                <p className="mt-4 inline-block rounded-sm bg-surface-container-highest px-3 py-1 font-display text-label-md uppercase text-neutral-600 ring-1 ring-ghost-line">
                  {phase.duration}
                </p>
              </div>
              <div className="lg:col-span-8">
                <h3 className="font-display text-2xl font-bold text-neutral-900">
                  {phase.title}
                </h3>
                <p className="mt-4 text-neutral-600">{phase.description}</p>
                <p className="mt-6 text-sm font-medium text-neutral-800">
                  {dict.common.deliverablePrefix} {phase.deliverable}
                </p>
              </div>
            </div>
          </Section>
        ))}
      </div>

      <Section variant="muted" className="py-16 lg:py-20">
        <div className="mx-auto max-w-3xl border-l-4 border-accent bg-surface-elevated px-8 py-10 shadow-sm">
          <blockquote className="text-center text-lg text-neutral-700">
            {p.quote}
          </blockquote>
          <p className="mt-6 text-center font-semibold text-accent">
            {p.quoteTagline}
          </p>
        </div>
      </Section>

      <CTASection
        title={p.cta.title}
        subtitle={p.cta.subtitle}
        ctaLabel={p.cta.button}
        ctaHref={localePath(locale, '/contact')}
      />
    </>
  );
}
