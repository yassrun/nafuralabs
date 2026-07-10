import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { HIJRI_ENABLED_STORAGE_KEY, HijriCalendarService } from '@core/i18n/hijri-calendar.service';

import { DateLocalizedPipe } from './date-localized.pipe';

interface FakeTranslateService {
  currentLang: string | undefined;
  defaultLang: string | undefined;
  onLangChange: Subject<{ lang: string; translations: unknown }>;
}

function createFakeTranslate(initialLang?: string): FakeTranslateService {
  return {
    currentLang: initialLang,
    defaultLang: 'fr',
    onLangChange: new Subject(),
  };
}

function clearHijriStorage(): void {
  try {
    localStorage.removeItem(HIJRI_ENABLED_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function setupPipe(initialLang?: string): {
  pipe: DateLocalizedPipe;
  translate: FakeTranslateService;
  cdr: jasmine.SpyObj<ChangeDetectorRef>;
  hijri: HijriCalendarService;
} {
  const translate = createFakeTranslate(initialLang);
  const cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', [
    'markForCheck',
    'detectChanges',
    'detach',
    'reattach',
    'checkNoChanges',
  ]);
  TestBed.configureTestingModule({
    providers: [
      DateLocalizedPipe,
      { provide: TranslateService, useValue: translate },
      { provide: ChangeDetectorRef, useValue: cdr },
    ],
  });
  const pipe = TestBed.inject(DateLocalizedPipe);
  const hijri = TestBed.inject(HijriCalendarService);
  return { pipe, translate, cdr, hijri };
}

describe('DateLocalizedPipe', () => {
  const sampleDate = new Date(Date.UTC(2026, 4, 21, 12, 0, 0)); // 2026-05-21T12:00:00Z

  beforeEach(() => {
    clearHijriStorage();
  });

  afterEach(() => {
    clearHijriStorage();
    TestBed.resetTestingModule();
  });

  it('formats with the FR-MA locale when currentLang is "fr"', () => {
    const { pipe } = setupPipe('fr');
    const out = pipe.transform(sampleDate, 'mediumDate');
    expect(out).not.toBeNull();
    expect(out).toMatch(/2026/);
    expect(out!.toLowerCase()).toContain('mai'); // French month "mai"
  });

  it('formats with the en-US locale when currentLang is "en"', () => {
    const { pipe } = setupPipe('en');
    const out = pipe.transform(sampleDate, 'mediumDate');
    expect(out).not.toBeNull();
    expect(out).toMatch(/2026/);
    expect(out!).toContain('May'); // English month "May"
  });

  it('formats with the ar-MA locale when currentLang is "ar"', () => {
    const { pipe } = setupPipe('ar');
    const out = pipe.transform(sampleDate, 'mediumDate');
    expect(out).not.toBeNull();
    // ar-MA may use Arabic characters or Latin; assert non-empty + contains the year (Latin or Arabic-Indic digits)
    expect(out!.length).toBeGreaterThan(0);
    const hasYear = /2026/.test(out!) || /٢٠٢٦/.test(out!);
    expect(hasYear).toBeTrue();
  });

  it('falls back to fr-MA when language is unknown / empty', () => {
    const { pipe } = setupPipe('zz');
    const out = pipe.transform(sampleDate, 'mediumDate');
    expect(out).not.toBeNull();
    expect(out!.toLowerCase()).toContain('mai'); // French fallback
  });

  it('returns null for null / undefined / empty string', () => {
    const { pipe } = setupPipe('fr');
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
  });

  it('reacts to onLangChange and reformats on next transform (pure: false reactivity)', () => {
    const { pipe, translate, cdr } = setupPipe('fr');
    const frOut = pipe.transform(sampleDate, 'mediumDate');
    expect(frOut!.toLowerCase()).toContain('mai');

    translate.currentLang = 'en';
    translate.onLangChange.next({ lang: 'en', translations: {} });

    expect(cdr.markForCheck).toHaveBeenCalled();

    const enOut = pipe.transform(sampleDate, 'mediumDate');
    expect(enOut!).toContain('May');
  });

  it('respects custom patterns like dd/MM/yyyy regardless of locale', () => {
    const { pipe } = setupPipe('en');
    const out = pipe.transform(sampleDate, 'dd/MM/yyyy', 'UTC');
    expect(out).toBe('21/05/2026');
  });

  it('uses mediumDate as default format when none is provided', () => {
    const { pipe } = setupPipe('fr');
    const explicit = pipe.transform(sampleDate, 'mediumDate');
    const implicit = pipe.transform(sampleDate);
    expect(implicit).toBe(explicit);
  });

  // ----------------------------------------------------------------------
  // Phase 4.3 / Wave D3 — calendrier hijri optionnel
  // ----------------------------------------------------------------------

  it('does not append the hijri suffix when HijriCalendarService.enabled() === false (default)', () => {
    const { pipe, hijri } = setupPipe('fr');
    expect(hijri.enabled()).toBeFalse();
    const out = pipe.transform(sampleDate, 'dd/MM/yyyy', 'UTC');
    expect(out).toBe('21/05/2026');
    expect(out!.includes('(')).toBeFalse();
  });

  it('appends the hijri suffix when HijriCalendarService.enabled() === true (FR)', () => {
    const { pipe, hijri } = setupPipe('fr');
    hijri.setEnabled(true);
    const out = pipe.transform(sampleDate, 'dd/MM/yyyy', 'UTC');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/^21\/05\/2026 \(.+\)$/);
    expect(out!).toMatch(/144[67]/);
  });

  it('appends the hijri suffix when HijriCalendarService.enabled() === true (EN)', () => {
    const { pipe, hijri } = setupPipe('en');
    hijri.setEnabled(true);
    const out = pipe.transform(sampleDate, 'dd/MM/yyyy', 'UTC');
    expect(out).not.toBeNull();
    expect(out!).toMatch(/^21\/05\/2026 \(.+\)$/);
    expect(out!).toMatch(/144[67]/);
  });

  it('returns gregorian alone when hijri is enabled but Intl islamic is unavailable', () => {
    const { pipe, hijri } = setupPipe('fr');
    hijri.setEnabled(true);
    const originalDTF = Intl.DateTimeFormat;
    spyOn(Intl, 'DateTimeFormat').and.callFake(((locale: string, options?: Intl.DateTimeFormatOptions) => {
      if (typeof locale === 'string' && locale.includes('islamic-umalqura')) {
        throw new RangeError('islamic-umalqura calendar not supported');
      }
      return new originalDTF(locale, options);
    }) as unknown as typeof Intl.DateTimeFormat);

    const out = pipe.transform(sampleDate, 'dd/MM/yyyy', 'UTC');
    expect(out).toBe('21/05/2026');
  });
});
