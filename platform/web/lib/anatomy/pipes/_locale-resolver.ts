/**
 * Locale resolver (private helper for the `*Localized` pipes — Phase 1.3 / agent B3).
 *
 * ============================================================================
 *   Pourquoi un helper séparé ?
 * ============================================================================
 * Les 4 wrappers (`dateLocalized`, `numberLocalized`, `currencyLocalized`,
 * `percentLocalized`) partagent EXACTEMENT la même logique de mapping
 * langue runtime → locale BCP-47. DRY : centralisé ici.
 *
 * Le préfixe `_` du nom de fichier signale la nature **privée** (non
 * réexporté par le barrel `pipes/index.ts`). Les consommateurs externes
 * passent par les pipes ; la résolution de locale est un détail
 * d'implémentation.
 *
 * ============================================================================
 *   Mapping langue → locale BCP-47
 * ============================================================================
 *   - `fr` ou `fr-*` → `fr-MA`  (espace insécable comme séparateur de
 *                                milliers, virgule décimale, dates `dd/MM/yyyy`)
 *   - `en` ou `en-*` → `en-US`  (point décimal, virgule milliers, dates `M/d/yyyy`)
 *   - `ar` ou `ar-*` → `ar-MA`  (préparé Round 2 — RTL + chiffres arabes)
 *   - défaut / inconnu / null → `fr-MA`
 *
 * Aligné avec `web/app/platform/core/i18n/locale-id.factory.ts` (agent B1).
 * Volontairement non importé pour conserver l'isolation entre les deux
 * fichiers Wave B (cf. AGENT_RULES section 8.2).
 *
 * ============================================================================
 *   Registration des locales
 * ============================================================================
 * Les pipes natifs Angular (`DatePipe`, `DecimalPipe`, `CurrencyPipe`,
 * `PercentPipe`) requièrent que les données de locale soient enregistrées
 * via `registerLocaleData()` avant utilisation. La registration ici est
 * **idempotente** : peut être appelée en double avec B1, sans effet de
 * bord.
 */

import { registerLocaleData } from '@angular/common';

import localeArMA from '@angular/common/locales/ar-MA';
import localeEn from '@angular/common/locales/en';
import localeFrMA from '@angular/common/locales/fr-MA';

import type { TranslateService } from '@ngx-translate/core';

/** Locale BCP-47 de repli quand la langue runtime est absente/inconnue. */
export const DEFAULT_PIPE_LOCALE = 'fr-MA' as const;

/** Mapping immuable langue (2-lettres ISO 639-1) → locale BCP-47. */
const LANG_BASE_TO_LOCALE: Readonly<Record<string, string>> = Object.freeze({
  fr: 'fr-MA',
  en: 'en-US',
  ar: 'ar-MA',
});

// Note : Angular ne fournit pas de pack `en-US` séparé (CLDR considère que
// `en` est le pack canonique avec la convention US comme défaut). On
// enregistre donc le pack `en` SOUS l'alias `en-US` pour que les pipes
// natifs résolvent correctement la locale.
const LOCALES_TO_REGISTER: ReadonlyArray<readonly [unknown, string]> = [
  [localeFrMA, 'fr-MA'],
  [localeEn, 'en-US'],
  [localeArMA, 'ar-MA'],
];

let registered = false;

/**
 * Enregistre les locales BCP-47 utilisées par les pipes wrappers.
 * Idempotent : appelable plusieurs fois (et en parallèle avec
 * `ensureLocalesRegistered` du fichier B1) sans dupliquer la registration.
 *
 * Exporté pour les specs qui veulent garantir la registration avant
 * d'instancier `DatePipe` / `DecimalPipe` / `CurrencyPipe` / `PercentPipe`.
 */
export function ensurePipeLocalesRegistered(): void {
  if (registered) {
    return;
  }
  for (const [data, id] of LOCALES_TO_REGISTER) {
    registerLocaleData(data, id);
  }
  registered = true;
}

ensurePipeLocalesRegistered();

/**
 * Map d'une langue (`fr`, `en-US`, `ar-MA`, casse arbitraire, etc.) vers la
 * locale BCP-47 appropriée. Strip le suffixe régional pour ne garder que la
 * base ISO 639-1.
 *
 * Tolérant : accepte `null`, `undefined`, valeur inconnue. Retombe toujours
 * sur {@link DEFAULT_PIPE_LOCALE}.
 *
 * @example
 *   mapLangToPipeLocale('fr')     // 'fr-MA'
 *   mapLangToPipeLocale('fr-FR')  // 'fr-MA' (le pack FR-FR est mappé sur la locale MA)
 *   mapLangToPipeLocale('EN')     // 'en-US'
 *   mapLangToPipeLocale('ar-MA')  // 'ar-MA'
 *   mapLangToPipeLocale('zh')     // 'fr-MA' (fallback)
 *   mapLangToPipeLocale(null)     // 'fr-MA'
 */
export function mapLangToPipeLocale(lang: string | null | undefined): string {
  if (!lang || typeof lang !== 'string') {
    return DEFAULT_PIPE_LOCALE;
  }
  const base = lang.toLowerCase().split('-')[0];
  return LANG_BASE_TO_LOCALE[base] ?? DEFAULT_PIPE_LOCALE;
}

/**
 * Résout la locale BCP-47 à utiliser pour les pipes Angular natifs à partir
 * du `TranslateService` courant.
 *
 * Priorité : `currentLang` > `defaultLang` > {@link DEFAULT_PIPE_LOCALE}.
 *
 * @example
 *   resolveLocale(translateService) // 'fr-MA' si currentLang === 'fr'
 */
export function resolveLocale(
  translateService: Pick<TranslateService, 'currentLang' | 'defaultLang'> | null | undefined,
): string {
  if (!translateService) {
    return DEFAULT_PIPE_LOCALE;
  }
  const lang = translateService.currentLang ?? translateService.defaultLang ?? null;
  return mapLangToPipeLocale(lang);
}
