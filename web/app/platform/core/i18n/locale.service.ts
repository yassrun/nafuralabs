import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);

  init(): void {
    this.syncFromLang(this.translate.currentLang ?? 'fr');
    this.translate.onLangChange.subscribe(({ lang }) => this.syncFromLang(lang));
  }

  /**
   * Sets `document.documentElement.lang` and `dir` (RTL for Arabic).
   * Safe to call after every `TranslateService.use(lang)` so `<html>` stays in sync even if `onLangChange` ordering varies.
   */
  syncFromLang(lang: string): void {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
