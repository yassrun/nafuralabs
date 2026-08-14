/**
 * `numberLocalized` — wrapper réactif sur `DecimalPipe` (Phase 1.3 / agent B3).
 *
 * ============================================================================
 *   Pourquoi ce pipe ?
 * ============================================================================
 * `| number` natif est figé sur la locale du bootstrap. En FR-MA : `1 234,56`
 * (espace insécable + virgule). En EN-US : `1,234.56` (virgule millier +
 * point décimal). Sans wrapper, le changement de langue à chaud ne se
 * propage pas au format.
 *
 * ============================================================================
 *   Usage
 * ============================================================================
 * ```html
 * {{ montantHT | numberLocalized }}
 * {{ tauxTVA | numberLocalized:'1.2-2' }}
 * ```
 *
 * **Préfère ce pipe au `| number` natif** pour tout nombre affiché à
 * l'utilisateur final.
 *
 * ============================================================================
 *   Choix techniques
 * ============================================================================
 * - `pure: false` OBLIGATOIRE (cf. `date-localized.pipe.ts` pour la
 *   justification détaillée).
 * - Souscription à `onLangChange` + `markForCheck()` pour propager le
 *   re-render même en mode `ChangeDetectionStrategy.OnPush`.
 * - Délègue au `DecimalPipe` Angular natif (4e arg `locale` au transform).
 *
 * @see _locale-resolver.ts
 */

import { DecimalPipe } from '@angular/common';
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

@Pipe({ name: 'numberLocalized', standalone: true, pure: false })
export class NumberLocalizedPipe implements PipeTransform, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly underlying = new DecimalPipe(DEFAULT_PIPE_LOCALE);
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
   * @param value      Nombre ou chaîne numérique.
   * @param digitsInfo Format Angular `'{minIntDigits}.{minFracDigits}-{maxFracDigits}'`
   *                   (ex. `'1.2-2'` force 2 décimales). Défaut : pipe natif.
   * @returns          Chaîne formatée, ou `null` si la valeur n'est pas un
   *                   nombre valide.
   */
  transform(
    value: number | string | null | undefined,
    digitsInfo?: string,
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    try {
      return this.underlying.transform(value, digitsInfo, this.currentLocale);
    } catch {
      return null;
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
