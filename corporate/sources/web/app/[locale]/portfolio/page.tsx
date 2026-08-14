import type { Metadata } from 'next';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
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
    title: dict.meta.portfolio.title,
    description: dict.meta.portfolio.description,
    openGraph: {
      title: dict.meta.portfolio.title,
      description: dict.meta.portfolio.description,
    },
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const p = dict.portfolio;

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

      <Section variant="light" className="py-20 lg:py-28">
        <SectionHeading title={p.origin.title} align="left" />
        <p className="mt-6 max-w-3xl text-neutral-600">{p.origin.intro}</p>
        <div className="mt-12 space-y-10 border-l-2 border-ghost-line pl-8">
          {p.experience.map((e) => (
            <article key={e.subtitle} className="relative">
              <span
                className="absolute -left-[calc(2rem+5px)] top-1 h-3 w-3 rounded-full bg-primary"
                aria-hidden
              />
              <h3 className="font-display text-xl font-bold text-neutral-900">
                {e.title}
              </h3>
              <p className="mt-1 text-sm font-semibold text-primary">
                {e.subtitle}
              </p>
              <p className="mt-3 text-neutral-600">{e.description}</p>
              <p className="mt-3 text-xs font-medium text-neutral-500">
                {e.tag}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section variant="muted" className="py-20 lg:py-28">
        <SectionHeading
          title={p.btp.title}
          subtitle={p.btp.subtitle}
          align="left"
        />
        <div className="mt-10 max-w-3xl space-y-6 text-neutral-600">
          <p>
            <span className="font-semibold text-neutral-900">
              {p.btp.industryLabel}
            </span>{' '}
            {p.btp.industryValue}
          </p>
          <p>
            <span className="font-semibold text-neutral-900">
              {p.btp.challengeLabel}
            </span>{' '}
            {p.btp.challengeBody}
          </p>
          <p>
            <span className="font-semibold text-neutral-900">
              {p.btp.solutionLabel}
            </span>{' '}
            {p.btp.solutionBody}
          </p>
          <div>
            <p className="font-semibold text-neutral-900">
              {p.btp.featuresTitle}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {p.btp.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div className="pt-2">
            <Badge text={p.btp.badge} variant="gold" />
          </div>
        </div>
      </Section>

      <Section variant="light" className="py-16 lg:py-20">
        <SectionHeading title={p.tech.title} align="center" />
        <p className="mt-8 text-center text-sm font-medium tracking-wider text-neutral-400">
          {p.tech.stack}
        </p>
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
