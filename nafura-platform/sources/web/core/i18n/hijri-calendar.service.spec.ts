/**
 * Tests Karma/Jasmine pour `HijriCalendarService` (Phase 4.3 / agent D3).
 *
 * Couverture :
 *   1. `enabled()` défaut `false` (clé localStorage absente)
 *   2. `enabled()` lit `localStorage` au boot ("true" → true)
 *   3. `toggle()` bascule l'état + persiste
 *   4. `setEnabled(boolean)` force l'état + persiste
 *   5. `formatHijri()` retourne une chaîne non-vide pour une date valide (FR)
 *   6. `formatHijri()` retourne une chaîne non-vide pour une date valide (EN)
 *   7. `formatHijri()` retourne `''` pour `null` / `undefined` / `''`
 *   8. `formatHijri()` retourne `''` pour une date invalide (`new Date('not-a-date')`)
 *   9. `formatHijri()` fallback `''` si `Intl.DateTimeFormat` throw (mock)
 *  10. `formatWithHijri()` retourne la chaîne grégorienne telle quelle quand OFF
 *  11. `formatWithHijri()` suffixe `" (…)"` quand ON et que formatHijri renvoie un résultat
 *  12. `formatWithHijri()` retourne grégorien seul si Intl islamic indispo même quand ON
 */

import { TestBed } from '@angular/core/testing';

import { HIJRI_ENABLED_STORAGE_KEY, HijriCalendarService } from './hijri-calendar.service';

function clearStorage(): void {
  try {
    localStorage.removeItem(HIJRI_ENABLED_STORAGE_KEY);
  } catch {
    // ignore in test environments without localStorage
  }
}

function setStorage(value: string): void {
  try {
    localStorage.setItem(HIJRI_ENABLED_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

describe('HijriCalendarService', () => {
  // 2026-05-21T12:00:00Z corresponds roughly to 4 dhū l-qaʿda 1447 (Umm-al-Qura).
  const sampleDate = new Date(Date.UTC(2026, 4, 21, 12, 0, 0));

  beforeEach(() => {
    clearStorage();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    clearStorage();
  });

  it('defaults to enabled() === false when localStorage is empty', () => {
    const service = TestBed.inject(HijriCalendarService);
    expect(service.enabled()).toBeFalse();
  });

  it('initialises enabled() === true when localStorage contains "true"', () => {
    setStorage('true');
    const service = TestBed.inject(HijriCalendarService);
    expect(service.enabled()).toBeTrue();
  });

  it('toggle() flips state and persists to localStorage', () => {
    const service = TestBed.inject(HijriCalendarService);
    expect(service.enabled()).toBeFalse();

    service.toggle();
    expect(service.enabled()).toBeTrue();
    expect(localStorage.getItem(HIJRI_ENABLED_STORAGE_KEY)).toBe('true');

    service.toggle();
    expect(service.enabled()).toBeFalse();
    expect(localStorage.getItem(HIJRI_ENABLED_STORAGE_KEY)).toBe('false');
  });

  it('setEnabled(value) forces the state and persists', () => {
    const service = TestBed.inject(HijriCalendarService);
    service.setEnabled(true);
    expect(service.enabled()).toBeTrue();
    expect(localStorage.getItem(HIJRI_ENABLED_STORAGE_KEY)).toBe('true');

    service.setEnabled(false);
    expect(service.enabled()).toBeFalse();
    expect(localStorage.getItem(HIJRI_ENABLED_STORAGE_KEY)).toBe('false');
  });

  it('formatHijri() returns a non-empty FR string for a valid date', () => {
    const service = TestBed.inject(HijriCalendarService);
    const out = service.formatHijri(sampleDate, 'fr-MA');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
    // FR formatting yields something like "4 dhou al qi'da 1447" — assert year 1447 always.
    expect(out).toMatch(/144[67]/);
  });

  it('formatHijri() returns a non-empty EN string for a valid date', () => {
    const service = TestBed.inject(HijriCalendarService);
    const out = service.formatHijri(sampleDate, 'en-US');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/144[67]/);
  });

  it('formatHijri() returns "" for null / undefined / empty input', () => {
    const service = TestBed.inject(HijriCalendarService);
    expect(service.formatHijri(null)).toBe('');
    expect(service.formatHijri(undefined)).toBe('');
    expect(service.formatHijri('')).toBe('');
  });

  it('formatHijri() returns "" for an invalid date', () => {
    const service = TestBed.inject(HijriCalendarService);
    expect(service.formatHijri('not-a-date')).toBe('');
    expect(service.formatHijri(new Date('not-a-date'))).toBe('');
    expect(service.formatHijri(Number.NaN)).toBe('');
  });

  it('formatHijri() returns "" when Intl.DateTimeFormat throws (older engines)', () => {
    const service = TestBed.inject(HijriCalendarService);
    const originalDTF = Intl.DateTimeFormat;
    spyOn(Intl, 'DateTimeFormat').and.callFake(((locale: string, options?: Intl.DateTimeFormatOptions) => {
      if (typeof locale === 'string' && locale.includes('islamic-umalqura')) {
        throw new RangeError('islamic-umalqura calendar not supported');
      }
      return new originalDTF(locale, options);
    }) as unknown as typeof Intl.DateTimeFormat);

    expect(service.formatHijri(sampleDate, 'fr-MA')).toBe('');
  });

  it('formatWithHijri() returns the gregorian string unchanged when enabled === false', () => {
    const service = TestBed.inject(HijriCalendarService);
    expect(service.enabled()).toBeFalse();
    const out = service.formatWithHijri(sampleDate, '21/05/2026', 'fr-MA');
    expect(out).toBe('21/05/2026');
  });

  it('formatWithHijri() suffixes "(<hijri>)" when enabled === true', () => {
    const service = TestBed.inject(HijriCalendarService);
    service.setEnabled(true);
    const out = service.formatWithHijri(sampleDate, '21/05/2026', 'fr-MA');
    expect(out).toMatch(/^21\/05\/2026 \(.+\)$/);
    expect(out).toMatch(/144[67]/);
  });

  it('formatWithHijri() returns gregorian alone when enabled but Intl islamic unavailable', () => {
    const service = TestBed.inject(HijriCalendarService);
    service.setEnabled(true);
    const originalDTF = Intl.DateTimeFormat;
    spyOn(Intl, 'DateTimeFormat').and.callFake(((locale: string, options?: Intl.DateTimeFormatOptions) => {
      if (typeof locale === 'string' && locale.includes('islamic-umalqura')) {
        throw new RangeError('islamic-umalqura calendar not supported');
      }
      return new originalDTF(locale, options);
    }) as unknown as typeof Intl.DateTimeFormat);

    const out = service.formatWithHijri(sampleDate, '21/05/2026', 'fr-MA');
    expect(out).toBe('21/05/2026');
  });
});
