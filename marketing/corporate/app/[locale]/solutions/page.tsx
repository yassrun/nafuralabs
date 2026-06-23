import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { Card } from '@/components/Card';
import { Grid } from '@/components/Grid';
import { CTASection } from '@/components/CTASection';
import { Badge } from '@/components/Badge';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/paths';

const verticalIcons = ['▣', '◈', '◇', '⬡'] as const;
const serviceIcons = ['→', '◎', '◇', '◈', '▣'] as const;

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  return {
    title: dict.meta.solutions.title,
    description: dict.meta.solutions.description,
    openGraph: {
      title: dict.meta.solutions.title,
      description: dict.meta.solutions.description,
    },
  };
}

export default async function SolutionsPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const dict = await getDictionary(locale);
  const s = dict.solutions;

  return (
    <>
      <Section variant="dark" mesh className="pt-28 pb-16 lg:pt-36 lg:pb-20">
        <SectionHeading
          as="h1"
          dark
          align="center"
          title={s.hero.title}
          subtitle={s.hero.subtitle}
        />
      </Section>

      <Section variant="light" className="py-20 lg:py-28">
        <SectionHeading
          title={s.platform.title}
          subtitle={s.platform.subtitle}
          align="left"
        />
        <div className="mt-14">
          <Grid cols={2}>
            {s.platform.features.map((f, i) => (
              <Card key={f.title} delay={i * 0.05}>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500">{f.body}</p>
              </Card>
            ))}
          </Grid>
        </div>
      </Section>

      <Section variant="muted" className="py-20 lg:py-28">
        <SectionHeading
          title={s.verticals.title}
          subtitle={s.verticals.subtitle}
          align="center"
        />
        <div className="mt-14">
          <Grid cols={2}>
            {s.verticals.items.map((v, i) => {
              const card = (
                <Card delay={i * 0.06} className="h-full p-8">
                  <span className="text-3xl text-accent" aria-hidden>
                    {verticalIcons[i % verticalIcons.length]}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold text-neutral-900">
                    {v.title}
                  </h3>
                  <p className="mt-3 text-neutral-500">{v.body}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge text={v.tag} variant="teal" />
                    {v.soon ? (
                      <span className="text-sm italic text-neutral-400">
                        {dict.common.comingSoon}
                      </span>
                    ) : (
                      i === 0 && (
                        <span className="text-sm font-medium text-primary">
                          {dict.nav.sektor} →
                        </span>
                      )
                    )}
                  </div>
                </Card>
              );
              return i === 0 ? (
                <Link
                  key={v.title}
                  href={localePath(locale, '/sektor')}
                  className="block h-full"
                >
                  {card}
                </Link>
              ) : (
                <div key={v.title} className="h-full">
                  {card}
                </div>
              );
            })}
          </Grid>
        </div>
      </Section>

      <Section variant="light" id="services" className="py-20 lg:py-28">
        <SectionHeading title={s.services.title} align="center" />
        <div className="mt-14">
          <Grid cols={3}>
            {s.services.items.map((item, i) => (
              <Card key={item.title} delay={i * 0.05}>
                <span className="text-2xl text-accent" aria-hidden>
                  {serviceIcons[i % serviceIcons.length]}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500">{item.body}</p>
              </Card>
            ))}
          </Grid>
        </div>
      </Section>

      <Section variant="muted" className="py-20 lg:py-28">
        <SectionHeading
          title={s.advantage.title}
          subtitle={s.advantage.subtitle}
          align="center"
        />
        <div className="mt-14 overflow-x-auto rounded bg-surface-container-highest shadow-ambient ring-1 ring-ghost-line">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-ghost-line bg-primary px-4 py-3 font-semibold text-white" />
                <th className="border-b border-ghost-line bg-primary px-4 py-3 font-semibold text-white">
                  {s.advantage.colTraditional}
                </th>
                <th className="border-b border-ghost-line bg-primary px-4 py-3 font-semibold text-white">
                  {s.advantage.colNafura}
                </th>
              </tr>
            </thead>
            <tbody>
              {s.advantage.rows.map((row, ri) => (
                <tr
                  key={row.label}
                  className={ri % 2 === 1 ? 'bg-surface-container-low/60' : ''}
                >
                  <td className="border-b border-ghost-line px-4 py-3 font-medium text-neutral-700">
                    {row.label}
                  </td>
                  <td className="border-b border-ghost-line px-4 py-3 text-neutral-600">
                    {row.traditional}
                  </td>
                  <td className="border-b border-ghost-line bg-accent-muted/80 px-4 py-3 text-neutral-800">
                    {row.nafura}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
