/**
 * I18n Service
 * 
 * Centralized service for internationalization.
 * Provides safe translation methods (avoiding instant() by default).
 */

import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { I18N_CONFIG, getInitialLanguage, saveLanguagePreference } from './i18n.config';
import { LanguagePreferenceService } from './language-preference.service';
import { LocaleService } from './locale.service';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService);
  private readonly languagePreference = inject(LanguagePreferenceService);
  private readonly locale = inject(LocaleService);

  /**
   * Initialize the translation service (local language only).
   * Should be called once at app startup.
   */
  initialize(): void {
    const initialLang = getInitialLanguage();
    this.translate.setDefaultLang(I18N_CONFIG.fallbackLanguage);
    this.translate.use(initialLang);
    this.locale.syncFromLang(initialLang);
  }

  /**
   * Load saved language from user settings API.
   * Call only when the user is authenticated (requires bearer token).
   */
  async loadRemoteLanguagePreference(): Promise<void> {
    const saved = await firstValueFrom(
      this.languagePreference.load().pipe(catchError(() => of(null)))
    );
    if (!saved) {
      return;
    }
    const normalized = saved.toLowerCase();
    if (!I18N_CONFIG.supportedLanguages.includes(normalized as (typeof I18N_CONFIG.supportedLanguages)[number])) {
      return;
    }
    if (normalized !== this.getCurrentLanguage()) {
      this.translate.use(normalized);
      this.locale.syncFromLang(normalized);
      saveLanguagePreference(normalized);
    }
  }

  /**
   * Get current language.
   */
  getCurrentLanguage(): string {
    return this.translate.currentLang || I18N_CONFIG.defaultLanguage;
  }

  /**
   * Change language.
   * @param lang Language code (e.g., 'fr', 'en')
   */
  useLanguage(lang: string): Observable<any> {
    if (!I18N_CONFIG.supportedLanguages.includes(lang as any)) {
      console.warn(`Unsupported language: ${lang}. Falling back to default.`);
      lang = I18N_CONFIG.defaultLanguage;
    }

    saveLanguagePreference(lang);
    return this.translate.use(lang).pipe(tap(() => this.locale.syncFromLang(lang)));
  }

  persistLanguagePreference(lang: string): void {
    this.languagePreference
      .save(lang)
      .pipe(take(1))
      .subscribe({
        error: () => {
          // Preference persistence is best-effort.
        },
      });
  }

  /**
   * Get translation as Observable (preferred method).
   * @param key Translation key
   * @param params Optional parameters for interpolation
   */
  get(key: string, params?: Record<string, any>): Observable<string> {
    return this.translate.get(key, params);
  }

  /**
   * Get translation synchronously (use with caution).
   * Only use when you're certain translations are loaded.
   * @param key Translation key
   * @param params Optional parameters for interpolation
   */
  instant(key: string, params?: Record<string, any>): string {
    const translation = this.translate.instant(key, params);
    // Warn only for key-like values (dot notation), not literal labels.
    const looksLikeTranslationKey = key.includes('.') && !/\s/.test(key);
    if (translation === key && looksLikeTranslationKey) {
      console.warn(`Missing translation for key: ${key}`);
    }
    return translation;
  }

  /**
   * Stream of current language changes.
   */
  onLanguageChange(): Observable<string> {
    return this.translate.onLangChange.pipe(
      map(event => event.lang)
    );
  }

  /**
   * Check if translations are loaded.
   */
  isReady(): boolean {
    return this.translate.currentLang !== undefined;
  }

  /**
   * Stream that emits when translations are ready.
   * Uses onTranslationChange which emits when translations are loaded.
   */
  onReady(): Observable<any> {
    // EventEmitter can be used as Observable in RxJS
    return new Observable(observer => {
      const subscription = this.translate.onTranslationChange.subscribe(event => {
        observer.next(event);
        observer.complete();
      });
      return () => subscription.unsubscribe();
    });
  }
}
