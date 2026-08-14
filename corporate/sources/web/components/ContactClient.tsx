'use client';

import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { useState } from 'react';
import { useDictionary } from '@/components/I18nProvider';

export function ContactClient() {
  const dict = useDictionary();
  const c = dict.contact;
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    await new Promise((r) => setTimeout(r, 800));
    setStatus('sent');
  }

  return (
    <>
      <Section variant="dark" mesh className="pt-28 pb-16 lg:pt-36 lg:pb-20">
        <SectionHeading
          as="h1"
          dark
          align="center"
          title={c.hero.title}
          subtitle={c.hero.subtitle}
        />
      </Section>

      <Section variant="light" className="py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
              {c.sidebar.heading}
            </h2>
            <p className="mt-4">
              <a
                href="mailto:contact@nafuralabs.com"
                className="text-neutral-600 underline-offset-4 transition hover:text-primary hover:underline"
              >
                contact@nafuralabs.com
              </a>
            </p>
            <p className="mt-3 text-neutral-600">{dict.footer.location}</p>
            <p className="mt-3 text-sm text-neutral-500">
              {c.sidebar.response}
            </p>
            <div className="my-8 h-px bg-ghost-line" aria-hidden />
            <p className="font-display text-label-md uppercase text-neutral-700">
              {c.sidebar.bookTitle}
            </p>
            <a
              href="#"
              className="mt-2 inline-block text-sm text-primary transition hover:text-primary-light"
            >
              {c.sidebar.calendly}
            </a>
            <p className="mt-6">
              <a
                href="#"
                className="text-sm text-primary transition hover:text-primary-light"
              >
                {c.sidebar.linkedin}
              </a>
            </p>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded bg-surface-container-highest p-8 shadow-ambient ring-1 ring-ghost-line"
            >
              <div>
                <label
                  htmlFor="contact-name"
                  className="block font-display text-label-md uppercase text-neutral-700"
                >
                  {c.form.name}
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="input-architect-boxed mt-2"
                  placeholder={c.form.placeholderName}
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block font-display text-label-md uppercase text-neutral-700"
                >
                  {c.form.email}
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input-architect-boxed mt-2"
                  placeholder={c.form.placeholderEmail}
                />
              </div>
              <div>
                <label
                  htmlFor="contact-company"
                  className="block font-display text-label-md uppercase text-neutral-700"
                >
                  {c.form.company}
                </label>
                <input
                  id="contact-company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  className="input-architect-boxed mt-2"
                  placeholder={c.form.placeholderCompany}
                />
              </div>
              <div>
                <label
                  htmlFor="contact-interest"
                  className="block font-display text-label-md uppercase text-neutral-700"
                >
                  {c.form.interest}
                </label>
                <select
                  id="contact-interest"
                  name="interest"
                  required
                  className="input-architect-boxed mt-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {c.form.selectPlaceholder}
                  </option>
                  {c.interestOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="block font-display text-label-md uppercase text-neutral-700"
                >
                  {c.form.message}
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  required
                  className="input-architect-boxed mt-2"
                  placeholder={c.form.placeholderMessage}
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-primary-gradient w-full py-3 disabled:opacity-50"
                >
                  {status === 'idle' && c.form.submitIdle}
                  {status === 'sending' && c.form.submitSending}
                  {status === 'sent' && c.form.submitSent}
                </button>
                {status === 'sent' && (
                  <p className="mt-3 text-center text-sm text-green-700">
                    {c.form.success}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </Section>
    </>
  );
}
