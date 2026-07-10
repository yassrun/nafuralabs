import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { resolveLocale } from './_locale-resolver';

/**
 * `mad` — pipe spécialisé MAD (Dirham marocain) au format **locale-aware**.
 *
 * Wrappe `Intl.NumberFormat(currentLocale, { style: 'currency', currency: 'MAD' })`
 * et réagit aux changements de langue runtime via `TranslateService.onLangChange`.
 * Pour la plupart des nouveaux écrans, préférer `| currencyLocalized:'MAD'` qui
 * offre la même réactivité tout en restant aligné avec les autres `*Localized`.
 */
@Pipe({ name: 'mad', standalone: true, pure: false })
export class MadCurrencyPipe implements PipeTransform, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private locale = resolveLocale(this.translate);
  private readonly sub: Subscription;

  constructor() {
    this.sub = this.translate.onLangChange.subscribe((event) => {
      this.locale = resolveLocale({
        currentLang: event?.lang ?? this.translate.currentLang,
        defaultLang: this.translate.defaultLang,
      });
      this.cdr.markForCheck();
    });
  }

  transform(value: number | string | null | undefined, decimals = 0): string {
    if (value == null || value === '') return '—';
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n)) return '—';
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: 'MAD',
      currencyDisplay: 'symbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
