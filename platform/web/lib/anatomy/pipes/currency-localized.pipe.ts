/**
 * `currencyLocalized` — wrapper réactif sur `CurrencyPipe` (Phase 1.3 / agent B3).
 *
 * ============================================================================
 *   Pourquoi ce pipe ?
 * ============================================================================
 * `| currency:'MAD'` natif est figé sur la locale du bootstrap. En FR-MA :
 * `1 234,56 MAD`. En EN-US : `MAD 1,234.56` (placement du symbole différent
 * selon la locale). Sans wrapper, la bascule à chaud ne reformatte rien.
 *
 * ============================================================================
 *   Usage
 * ============================================================================
 * ```html
 * {{ montant | currencyLocalized }}                   <!-- MAD par défaut -->
 * {{ montant | currencyLocalized:'EUR':'symbol' }}
 * {{ montant | currencyLocalized:'MAD':'symbol-narrow':'1.2-2' }}
 * ```
 *
 * **Préfère ce pipe au `| currency:'MAD'` natif** pour tout montant affiché
 * à l'utilisateur final. Le pipe `mad` (`MadCurrencyPipe`) reste utilisable
 * pour les cas où on veut forcer le format FR-MA quelle que soit la langue
 * (ex. impressions PDF officielles).
 *
 * ============================================================================
 *   Choix techniques
 * ============================================================================
 * - `pure: false` OBLIGATOIRE.
 * - Défaut `currencyCode = 'MAD'`, `display = 'symbol-narrow'` (Round 1 =
 *   devise unique MAD ; `symbol-narrow` aligne le rendu sur le pipe
 *   `MadCurrencyPipe` existant).
 *
 * @see _locale-resolver.ts
 * @see mad-currency.pipe.ts (alternative format FR-MA forcé)
 */

import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  inject,
  OnDestroy,
  Pipe,
  type PipeTransform,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import {
  DEFAULT_PIPE_LOCALE,
  ensurePipeLocalesRegistered,
  resolveLocale,
} from './_locale-resolver';

const DEFAULT_CURRENCY_CODE = 'MAD';
const DEFAULT_DISPLAY: 'symbol-narrow' = 'symbol-narrow';

@Pipe({ name: 'currencyLocalized', standalone: true, pure: false })
export class CurrencyLocalizedPipe implements PipeTransform, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly underlying = new CurrencyPipe(DEFAULT_PIPE_LOCALE, DEFAULT_CURRENCY_CODE);
  private currentLocale: string;
  private readonly sub: Subscription;

  constructor() {
    ensurePipeLocalesRegistered();
    this.currentLocale = resolveLocale(this.translate);
    this.sub = this.translate.onLangChange.subscribe((event) => {
      this.currentLocale = resolveLocale({
        currentLang: event?.lang ?? this.translate.currentLang,
        defaultLang: this.translate.defaultLang,
      });
      this.cdr.markForCheck();
    });
  }

  /**
   * @param value         Montant.
   * @param currencyCode  ISO 4217 (`'MAD'`, `'EUR'`, `'USD'`…). Défaut : `'MAD'`.
   * @param display       `'symbol'`, `'symbol-narrow'`, `'code'` ou booléen
   *                      (héritage Angular). Défaut : `'symbol-narrow'`.
   * @param digitsInfo    Format `'{minIntDigits}.{minFracDigits}-{maxFracDigits}'`.
   * @returns             Chaîne formatée, ou `null`.
   */
  transform(
    value: number | string | null | undefined,
    currencyCode: string = DEFAULT_CURRENCY_CODE,
    display: 'code' | 'symbol' | 'symbol-narrow' | string | boolean = DEFAULT_DISPLAY,
    digitsInfo?: string,
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    try {
      return this.underlying.transform(
        value,
        currencyCode,
        display,
        digitsInfo,
        this.currentLocale,
      );
    } catch {
      return null;
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
