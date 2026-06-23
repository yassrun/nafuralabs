/**
 * `percentLocalized` — wrapper réactif sur `PercentPipe` (Phase 1.3 / agent B3).
 *
 * ============================================================================
 *   Pourquoi ce pipe ?
 * ============================================================================
 * `| percent` natif est figé sur la locale du bootstrap. En FR-MA :
 * `12,5 %` (espace insécable + virgule). En EN-US : `12.5%` (point décimal,
 * pas d'espace). Sans wrapper, la bascule à chaud ne reformatte pas.
 *
 * ============================================================================
 *   Usage
 * ============================================================================
 * ```html
 * {{ ratio | percentLocalized }}              <!-- 0.125 → '12,5 %' en FR -->
 * {{ ratio | percentLocalized:'1.2-2' }}      <!-- '12,50 %' en FR / '12.50%' en EN -->
 * ```
 *
 * Note : comme le pipe Angular natif, **la valeur est multipliée par 100**.
 * Passe `0.125`, pas `12.5`, pour un affichage `12,5 %`.
 *
 * **Préfère ce pipe au `| percent` natif** dès qu'un pourcentage est affiché
 * à l'utilisateur final, pour que le format suive la langue runtime.
 *
 * @see _locale-resolver.ts
 */

import { PercentPipe } from '@angular/common';
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

@Pipe({ name: 'percentLocalized', standalone: true, pure: false })
export class PercentLocalizedPipe implements PipeTransform, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly underlying = new PercentPipe(DEFAULT_PIPE_LOCALE);
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
   * @param value      Ratio (`0.125` pour `12,5 %`).
   * @param digitsInfo Format Angular `'{minIntDigits}.{minFracDigits}-{maxFracDigits}'`.
   * @returns          Chaîne formatée, ou `null`.
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
