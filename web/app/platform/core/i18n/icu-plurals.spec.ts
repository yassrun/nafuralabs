/**
 * Tests Karma/Jasmine pour la convention ICU MessageFormat
 * (Phase 4.1 / Wave D1 — agent cursor-2026-05-27-D1).
 *
 * Couverture :
 *   1. `TranslateMessageFormatCompiler` est wired et compile bien les clés ICU
 *   2. Forme `=0` rendue (« Aucun … »)
 *   3. Forme `one` rendue (« 1 … »)
 *   4. Forme `other` rendue (« # … » avec substitution du compteur)
 *   5. Les 3 formes FR + EN existent pour `ventes.facture.count` (clé de
 *      référence utilisée par la spec — créée en mémoire dans ce test pour
 *      rester indépendant des packs JSON et fonctionner sans HTTP)
 *
 * Note : la spec n'utilise pas `HttpClient` (mock loader inline), afin que
 * `npx ng test` reste 100 % unitaire et n'ait pas besoin de servir les
 * assets `web/public/assets/i18n/**`.
 */

import { TestBed } from '@angular/core/testing';
import {
  TranslateCompiler,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { Observable, of } from 'rxjs';

/**
 * Loader inline qui retourne un dictionnaire FR/EN minimaliste contenant des
 * clés ICU pluralisées. C'est volontairement indépendant des fichiers JSON
 * du projet — l'objectif est de prouver que la *pipeline* (compiler +
 * service) résout correctement les 3 formes ICU.
 */
class InlineLoader implements TranslateLoader {
  private readonly dict: Record<string, Record<string, string>> = {
    fr: {
      'ventes.facture.count':
        '{count, plural, =0 {Aucune facture} one {1 facture} other {# factures}}',
      'shared.entityListing.toast.deleted':
        '{count, plural, =0 {Aucun élément supprimé.} one {1 élément supprimé.} other {# éléments supprimés.}}',
    },
    en: {
      'ventes.facture.count':
        '{count, plural, =0 {No invoice} one {1 invoice} other {# invoices}}',
      'shared.entityListing.toast.deleted':
        '{count, plural, =0 {No item deleted.} one {1 item deleted.} other {# items deleted.}}',
    },
  };

  getTranslation(lang: string): Observable<Record<string, string>> {
    return of(this.dict[lang] ?? {});
  }
}

describe('ICU MessageFormat plurals (Phase 4.1)', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: InlineLoader },
          compiler: { provide: TranslateCompiler, useClass: TranslateMessageFormatCompiler },
        }),
      ],
    });

    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('fr');
    translate.use('fr');
  });

  describe('ventes.facture.count (FR)', () => {
    beforeEach(() => translate.use('fr'));

    it('=0 → « Aucune facture »', () => {
      const out = translate.instant('ventes.facture.count', { count: 0 });
      expect(out).toBe('Aucune facture');
    });

    it('one → « 1 facture »', () => {
      const out = translate.instant('ventes.facture.count', { count: 1 });
      expect(out).toBe('1 facture');
    });

    it('other → « 5 factures »', () => {
      const out = translate.instant('ventes.facture.count', { count: 5 });
      expect(out).toBe('5 factures');
    });

    it('other → « 12 factures » (compteur ≥ 2)', () => {
      const out = translate.instant('ventes.facture.count', { count: 12 });
      expect(out).toBe('12 factures');
    });
  });

  describe('ventes.facture.count (EN)', () => {
    beforeEach(() => translate.use('en'));

    it('=0 → "No invoice"', () => {
      const out = translate.instant('ventes.facture.count', { count: 0 });
      expect(out).toBe('No invoice');
    });

    it('one → "1 invoice"', () => {
      const out = translate.instant('ventes.facture.count', { count: 1 });
      expect(out).toBe('1 invoice');
    });

    it('other → "5 invoices"', () => {
      const out = translate.instant('ventes.facture.count', { count: 5 });
      expect(out).toBe('5 invoices');
    });
  });

  describe('shared.entityListing.toast.deleted (FR + EN)', () => {
    it('FR =0 / one / other', () => {
      translate.use('fr');
      expect(translate.instant('shared.entityListing.toast.deleted', { count: 0 })).toBe(
        'Aucun élément supprimé.',
      );
      expect(translate.instant('shared.entityListing.toast.deleted', { count: 1 })).toBe(
        '1 élément supprimé.',
      );
      expect(translate.instant('shared.entityListing.toast.deleted', { count: 42 })).toBe(
        '42 éléments supprimés.',
      );
    });

    it('EN =0 / one / other', () => {
      translate.use('en');
      expect(translate.instant('shared.entityListing.toast.deleted', { count: 0 })).toBe(
        'No item deleted.',
      );
      expect(translate.instant('shared.entityListing.toast.deleted', { count: 1 })).toBe(
        '1 item deleted.',
      );
      expect(translate.instant('shared.entityListing.toast.deleted', { count: 42 })).toBe(
        '42 items deleted.',
      );
    });
  });

  describe('compiler integration', () => {
    it('TranslateMessageFormatCompiler is the active compiler (so {count, plural, ...} is resolved)', () => {
      const compiler = TestBed.inject(TranslateCompiler);
      expect(compiler).toBeInstanceOf(TranslateMessageFormatCompiler);
    });
  });
});
