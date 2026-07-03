/**
 * Tests Karma/Jasmine pour `locale-id.factory.ts` (Phase 1.1 — agent B1).
 *
 * Couverture exigée par la roadmap :
 *   1. `fr`  → `fr-MA`
 *   2. `en`  → `en-US`
 *   3. `ar`  → `ar-MA`
 *   4. `null` (rien en localStorage) → `fr-MA` (fallback)
 *   5. langue inconnue → `fr-MA` (fallback)
 *   6. devise = `MAD` toujours
 *
 * Plus quelques cas defensive : casse, tag région (`fr-FR`), undefined,
 * SSR (localStorage absent).
 */

import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';

import { I18N_CONFIG } from './i18n.config';
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE_ID,
  LANG_TO_LOCALE,
  currencyCodeFactory,
  ensureLocalesRegistered,
  localeIdFactory,
  mapLangToLocale,
  provideDynamicLocaleId,
} from './locale-id.factory';

describe('locale-id.factory', () => {
  describe('mapLangToLocale (mapping pur)', () => {
    it('mappe `fr` → `fr-MA` (format marocain)', () => {
      expect(mapLangToLocale('fr')).toBe('fr-MA');
    });

    it('mappe `en` → `en-US` (point décimal, virgule milliers)', () => {
      expect(mapLangToLocale('en')).toBe('en-US');
    });

    it('mappe `ar` → `ar-MA` (prêt pour Round 2 RTL)', () => {
      expect(mapLangToLocale('ar')).toBe('ar-MA');
    });

    it('retombe sur `fr-MA` quand l\'entrée est `null`', () => {
      expect(mapLangToLocale(null)).toBe(DEFAULT_LOCALE_ID);
      expect(mapLangToLocale(null)).toBe('fr-MA');
    });

    it('retombe sur `fr-MA` quand l\'entrée est `undefined`', () => {
      expect(mapLangToLocale(undefined)).toBe('fr-MA');
    });

    it('retombe sur `fr-MA` pour une langue inconnue (ex. `xx`, `zz`, `de`)', () => {
      expect(mapLangToLocale('xx')).toBe('fr-MA');
      expect(mapLangToLocale('zz')).toBe('fr-MA');
      expect(mapLangToLocale('de')).toBe('fr-MA');
    });

    it('tolère la casse (`FR`, `En`, `AR`)', () => {
      expect(mapLangToLocale('FR')).toBe('fr-MA');
      expect(mapLangToLocale('En')).toBe('en-US');
      expect(mapLangToLocale('AR')).toBe('ar-MA');
    });

    it('tolère un tag région (`fr-FR`, `en-GB`) — seule la base compte', () => {
      expect(mapLangToLocale('fr-FR')).toBe('fr-MA');
      expect(mapLangToLocale('en-GB')).toBe('en-US');
    });

    it('retombe sur `fr-MA` sur chaîne vide', () => {
      expect(mapLangToLocale('')).toBe('fr-MA');
    });
  });

  describe('currencyCodeFactory', () => {
    it('retourne toujours `MAD` (Round 1 = devise unique)', () => {
      expect(currencyCodeFactory()).toBe('MAD');
      expect(currencyCodeFactory()).toBe(DEFAULT_CURRENCY);
    });
  });

  describe('localeIdFactory (lecture localStorage)', () => {
    const KEY = I18N_CONFIG.storageKey;

    afterEach(() => {
      window.localStorage.removeItem(KEY);
    });

    it('retourne `fr-MA` quand aucune préférence n\'est persistée', () => {
      window.localStorage.removeItem(KEY);
      expect(localeIdFactory()).toBe('fr-MA');
    });

    it('retourne `en-US` quand `en` est persisté', () => {
      window.localStorage.setItem(KEY, 'en');
      expect(localeIdFactory()).toBe('en-US');
    });

    it('retourne `fr-MA` quand `fr` est persisté', () => {
      window.localStorage.setItem(KEY, 'fr');
      expect(localeIdFactory()).toBe('fr-MA');
    });

    it('retourne `ar-MA` quand `ar` est persisté', () => {
      window.localStorage.setItem(KEY, 'ar');
      expect(localeIdFactory()).toBe('ar-MA');
    });

    it('retombe sur `fr-MA` si la valeur persistée est invalide', () => {
      window.localStorage.setItem(KEY, 'klingon');
      expect(localeIdFactory()).toBe('fr-MA');
    });

    it('retombe sur `fr-MA` si `localStorage.getItem` throw (SSR/sandbox)', () => {
      spyOn(window.localStorage, 'getItem').and.throwError('SecurityError');
      expect(localeIdFactory()).toBe('fr-MA');
    });
  });

  describe('provideDynamicLocaleId (factory de providers Angular)', () => {
    it('expose exactement 2 providers : `LOCALE_ID` + `DEFAULT_CURRENCY_CODE`', () => {
      const providers = provideDynamicLocaleId();
      expect(providers.length).toBe(2);

      const localeProvider = providers.find(
        (p): p is { provide: typeof LOCALE_ID; useFactory: () => string } =>
          typeof p === 'object' && p !== null && 'provide' in p && p.provide === LOCALE_ID
      );
      const currencyProvider = providers.find(
        (p): p is { provide: typeof DEFAULT_CURRENCY_CODE; useFactory: () => string } =>
          typeof p === 'object' &&
          p !== null &&
          'provide' in p &&
          p.provide === DEFAULT_CURRENCY_CODE
      );

      expect(localeProvider).toBeTruthy();
      expect(currencyProvider).toBeTruthy();
      expect(typeof localeProvider!.useFactory).toBe('function');
      expect(typeof currencyProvider!.useFactory).toBe('function');
    });

    it('la factory `DEFAULT_CURRENCY_CODE` retourne `MAD`', () => {
      const providers = provideDynamicLocaleId();
      const currencyProvider = providers.find(
        (p): p is { provide: typeof DEFAULT_CURRENCY_CODE; useFactory: () => string } =>
          typeof p === 'object' &&
          p !== null &&
          'provide' in p &&
          p.provide === DEFAULT_CURRENCY_CODE
      )!;
      expect(currencyProvider.useFactory()).toBe('MAD');
    });

    it('la factory `LOCALE_ID` reflète la préférence persistée', () => {
      window.localStorage.setItem(I18N_CONFIG.storageKey, 'en');
      const providers = provideDynamicLocaleId();
      const localeProvider = providers.find(
        (p): p is { provide: typeof LOCALE_ID; useFactory: () => string } =>
          typeof p === 'object' && p !== null && 'provide' in p && p.provide === LOCALE_ID
      )!;
      expect(localeProvider.useFactory()).toBe('en-US');
      window.localStorage.removeItem(I18N_CONFIG.storageKey);
    });
  });

  describe('LANG_TO_LOCALE (table de référence)', () => {
    it('couvre les 3 langues supportées par `I18N_CONFIG`', () => {
      for (const lang of I18N_CONFIG.supportedLanguages) {
        expect(LANG_TO_LOCALE[lang]).toBeTruthy();
      }
    });

    it('mappings figés : fr/en/ar → fr-MA/en-US/ar-MA', () => {
      expect(LANG_TO_LOCALE.fr).toBe('fr-MA');
      expect(LANG_TO_LOCALE.en).toBe('en-US');
      expect(LANG_TO_LOCALE.ar).toBe('ar-MA');
    });
  });

  describe('ensureLocalesRegistered', () => {
    it('est idempotente (peut être appelée plusieurs fois)', () => {
      expect(() => {
        ensureLocalesRegistered();
        ensureLocalesRegistered();
        ensureLocalesRegistered();
      }).not.toThrow();
    });
  });
});
