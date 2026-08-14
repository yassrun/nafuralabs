import {
  DEFAULT_PIPE_LOCALE,
  ensurePipeLocalesRegistered,
  mapLangToPipeLocale,
  resolveLocale,
} from './_locale-resolver';

describe('_locale-resolver', () => {
  describe('mapLangToPipeLocale', () => {
    it('maps "fr" base to fr-MA', () => {
      expect(mapLangToPipeLocale('fr')).toBe('fr-MA');
    });

    it('maps "fr-FR" / "FR" / "fr-CA" region variants to fr-MA', () => {
      expect(mapLangToPipeLocale('fr-FR')).toBe('fr-MA');
      expect(mapLangToPipeLocale('FR')).toBe('fr-MA');
      expect(mapLangToPipeLocale('fr-CA')).toBe('fr-MA');
    });

    it('maps "en" / "en-US" / "en-GB" to en-US', () => {
      expect(mapLangToPipeLocale('en')).toBe('en-US');
      expect(mapLangToPipeLocale('en-US')).toBe('en-US');
      expect(mapLangToPipeLocale('en-GB')).toBe('en-US');
      expect(mapLangToPipeLocale('EN')).toBe('en-US');
    });

    it('maps "ar" / "ar-MA" / "ar-SA" to ar-MA', () => {
      expect(mapLangToPipeLocale('ar')).toBe('ar-MA');
      expect(mapLangToPipeLocale('ar-MA')).toBe('ar-MA');
      expect(mapLangToPipeLocale('ar-SA')).toBe('ar-MA');
    });

    it('falls back to fr-MA for null / undefined / empty / unknown languages', () => {
      expect(mapLangToPipeLocale(null)).toBe(DEFAULT_PIPE_LOCALE);
      expect(mapLangToPipeLocale(undefined)).toBe(DEFAULT_PIPE_LOCALE);
      expect(mapLangToPipeLocale('')).toBe(DEFAULT_PIPE_LOCALE);
      expect(mapLangToPipeLocale('xx')).toBe(DEFAULT_PIPE_LOCALE);
      expect(mapLangToPipeLocale('zh-CN')).toBe(DEFAULT_PIPE_LOCALE);
    });
  });

  describe('resolveLocale', () => {
    it('prefers currentLang over defaultLang', () => {
      expect(
        resolveLocale({ currentLang: 'en', defaultLang: 'fr' } as never),
      ).toBe('en-US');
    });

    it('falls back to defaultLang when currentLang is missing', () => {
      expect(
        resolveLocale({ currentLang: undefined, defaultLang: 'ar' } as never),
      ).toBe('ar-MA');
    });

    it('returns fr-MA when service is null/undefined', () => {
      expect(resolveLocale(null)).toBe(DEFAULT_PIPE_LOCALE);
      expect(resolveLocale(undefined)).toBe(DEFAULT_PIPE_LOCALE);
    });
  });

  describe('ensurePipeLocalesRegistered', () => {
    it('is idempotent (does not throw on repeated calls)', () => {
      expect(() => ensurePipeLocalesRegistered()).not.toThrow();
      expect(() => ensurePipeLocalesRegistered()).not.toThrow();
      expect(() => ensurePipeLocalesRegistered()).not.toThrow();
    });
  });
});
