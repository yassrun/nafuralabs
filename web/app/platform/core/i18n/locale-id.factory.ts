/**
 * Dynamic LOCALE_ID + DEFAULT_CURRENCY_CODE providers (Phase 1.1 — Wave B / agent B1).
 *
 * ============================================================================
 *   Pourquoi pas une factory réactive ?
 * ============================================================================
 * Angular résout `LOCALE_ID` **une seule fois au bootstrap** par l'injecteur
 * racine. La valeur injectée dans les pipes `DatePipe`, `DecimalPipe`,
 * `CurrencyPipe`, `PercentPipe`, etc. est figée pour toute la session
 * d'exécution. Un `useFactory: () => translate.currentLang` ne sera donc
 * **jamais ré-évalué** quand l'utilisateur bascule FR → EN à chaud.
 *
 * Pour la réactivité runtime (re-formatage immédiat sur changement de
 * langue), il faut passer par des **wrappers de pipes** qui s'abonnent à
 * `TranslateService.onLangChange` — c'est le scope de l'agent B3
 * (Phase 1.3 : `dateLocalized`, `numberLocalized`, etc.).
 *
 * Cette factory garantit donc uniquement **deux choses minimales** :
 *   1. La locale initiale au bootstrap matche la préférence persistée
 *      (localStorage : clé `I18N_CONFIG.storageKey = 'seyrura:language'`,
 *      lue par `getInitialLanguage()`).
 *   2. La devise par défaut est toujours `MAD` (Round 1 = devise unique).
 *
 * Quand l'utilisateur change de langue à chaud, les pipes natifs `| date`
 * et `| number` continueront d'utiliser la locale du bootstrap — c'est
 * exactement la raison d'être des wrappers de B3. Les pipes wrappers
 * écoutent `onLangChange` et marquent leurs hôtes pour `ChangeDetection`.
 *
 * ============================================================================
 *   Mapping langue → locale BCP-47
 * ============================================================================
 *   - `fr` → `fr-MA` (format marocain : espace insécable comme séparateur
 *     de milliers, virgule décimale, dates `dd/MM/yyyy`)
 *   - `en` → `en-US`  (point décimal, virgule milliers, dates `M/d/yyyy`)
 *   - `ar` → `ar-MA`  (préparé pour Round 2 — RTL + chiffres arabes)
 *   - défaut / inconnu / null → `fr-MA`
 *
 *   Devise : toujours `MAD` (constant pour Round 1).
 *
 * ============================================================================
 *   Round 2 (AR/RTL)
 * ============================================================================
 * Quand AR sera réactivé, la registration de `ar-MA` est déjà présente
 * dans `LOCALES_TO_REGISTER` ci-dessous : aucun changement nécessaire ici,
 * il faudra juste basculer `I18N_CONFIG.supportedLanguages` côté
 * `i18n.config.ts` + sortir AR du statut ⏸️ dans `00-PROGRESS.md`.
 */

import {
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  type Provider,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';

import localeArMA from '@angular/common/locales/ar-MA';
import localeFrMA from '@angular/common/locales/fr-MA';

import { I18N_CONFIG, type SupportedLanguage } from './i18n.config';

/**
 * Locale BCP-47 par défaut quand la préférence est absente, invalide ou
 * non reconnue. Cohérent avec `I18N_CONFIG.defaultLanguage = 'fr'`.
 */
export const DEFAULT_LOCALE_ID = 'fr-MA';

/**
 * Devise par défaut — Round 1 = MAD uniquement.
 *
 * Round 2 pourra introduire une factory dynamique si multi-devise (ex.
 * filiales internationales). À ce moment, transformer en injection token
 * mutable + wrappers de pipes (cf. B3).
 */
export const DEFAULT_CURRENCY = 'MAD';

/**
 * Mapping immuable langue (2-lettres ISO 639-1) → locale BCP-47.
 *
 * Exposé pour les tests et pour un éventuel `LocaleService.localeFor(lang)`.
 */
export const LANG_TO_LOCALE: Readonly<Record<SupportedLanguage, string>> = {
  fr: 'fr-MA',
  en: 'en-US',
  ar: 'ar-MA',
} as const;

/**
 * `en-US` n'est PAS dans cette liste : c'est la locale par défaut bakée
 * dans Angular (`@angular/common` la résout sans `registerLocaleData`).
 * Aucun fichier `@angular/common/locales/en-US.js` n'existe d'ailleurs.
 */
const LOCALES_TO_REGISTER: ReadonlyArray<readonly [unknown, string]> = [
  [localeFrMA, 'fr-MA'],
  [localeArMA, 'ar-MA'],
] as const;

let registered = false;

/**
 * Enregistre les locales BCP-47 utilisées par les pipes Angular natifs.
 * Idempotent : peut être appelée plusieurs fois sans effet de bord.
 *
 * Exporté pour les tests qui veulent garantir la registration avant
 * d'instancier `formatDate` / `formatNumber`.
 */
export function ensureLocalesRegistered(): void {
  if (registered) {
    return;
  }
  for (const [data, id] of LOCALES_TO_REGISTER) {
    registerLocaleData(data, id);
  }
  registered = true;
}

ensureLocalesRegistered();

/**
 * Map d'une langue (`fr` / `en` / `ar`) vers la locale BCP-47 appropriée.
 *
 * Tolérant : accepte `null`, `undefined`, casse arbitraire, valeur
 * inconnue. Retombe toujours sur {@link DEFAULT_LOCALE_ID}.
 */
export function mapLangToLocale(lang: string | null | undefined): string {
  if (!lang) {
    return DEFAULT_LOCALE_ID;
  }
  const normalized = lang.toLowerCase().split('-')[0] as SupportedLanguage;
  return LANG_TO_LOCALE[normalized] ?? DEFAULT_LOCALE_ID;
}

/**
 * Lit la préférence linguistique persistée (localStorage clé
 * `I18N_CONFIG.storageKey`) et retourne la locale BCP-47 correspondante.
 *
 * Pendant le bootstrap, `I18nService.initialize()` n'a pas encore tourné,
 * donc on ne peut pas s'appuyer sur `TranslateService.currentLang`. On
 * tape directement dans `localStorage` (même source de vérité que
 * `getInitialLanguage()` dans `i18n.config.ts`).
 *
 * SSR-safe : si `window` ou `localStorage` est indisponible (rendu
 * serveur), retombe sur la valeur par défaut.
 */
export function localeIdFactory(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_LOCALE_ID;
  }
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(I18N_CONFIG.storageKey);
  } catch {
    stored = null;
  }
  return mapLangToLocale(stored);
}

/**
 * Devise par défaut consommée par le `CurrencyPipe` (`{{ x | currency }}`).
 *
 * Round 1 : trivial — toujours `MAD`. Promu en factory plutôt qu'en
 * `useValue` pour la cohérence d'API (et pour brancher facilement une
 * détection par tenant plus tard sans casser l'app.config).
 */
export function currencyCodeFactory(): string {
  return DEFAULT_CURRENCY;
}

/**
 * Providers à étaler dans `app.config.ts` :
 *
 * ```ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     ...provideDynamicLocaleId(),
 *     // ... autres providers
 *   ],
 * };
 * ```
 *
 * Fournit :
 *   - `LOCALE_ID` (factory qui lit la préférence persistée)
 *   - `DEFAULT_CURRENCY_CODE` (factory constante `MAD`)
 *
 * Voir aussi : commentaire d'en-tête de ce fichier pour la justification
 * du choix factory statique vs dynamique.
 */
export function provideDynamicLocaleId(): Provider[] {
  return [
    {
      provide: LOCALE_ID,
      useFactory: localeIdFactory,
    },
    {
      provide: DEFAULT_CURRENCY_CODE,
      useFactory: currencyCodeFactory,
    },
  ];
}
