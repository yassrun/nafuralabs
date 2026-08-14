/**
 * `dateLocalized` — wrapper réactif sur `DatePipe` (Phase 1.3 / agent B3,
 * étendu Phase 4.3 / agent D3 pour le calendrier hégire).
 *
 * ============================================================================
 *   Pourquoi ce pipe ?
 * ============================================================================
 * Le pipe Angular natif `| date` consomme `LOCALE_ID` qui est résolu **une
 * seule fois au bootstrap**. Quand l'utilisateur bascule FR → EN à chaud
 * via le `LanguageSelector`, le format de date ne suit pas : on continue
 * d'afficher `21/05/2026` au lieu de `5/21/26`.
 *
 * Ce wrapper :
 *   1. S'abonne à `TranslateService.onLangChange`.
 *   2. Map la langue runtime vers la locale BCP-47 correspondante (cf.
 *      `_locale-resolver.ts`).
 *   3. Force le re-render via `ChangeDetectorRef.markForCheck()` + le flag
 *      `pure: false` (impératif — sinon Angular cache le résultat).
 *   4. **Phase 4.3** — suffixe optionnel `(jj mois aaaa hégire)` quand
 *      l'utilisateur a activé `HijriCalendarService.enabled()` dans son
 *      menu profil. Aucun coût si désactivé.
 *
 * ============================================================================
 *   Usage
 * ============================================================================
 * ```html
 * {{ contrat.dateSignature | dateLocalized:'mediumDate' }}
 * {{ facture.dateEmission | dateLocalized:'dd/MM/yyyy':'UTC' }}
 * ```
 *
 * **Préfère ce pipe au `| date` natif** dès qu'une date est affichée pour
 * l'utilisateur final, pour que le format suive la langue runtime.
 *
 * Avec le toggle hijri activé, la sortie devient par exemple :
 *   `21/05/2026 (4 dhou al qi'da 1447)` (FR) ou
 *   `May 21, 2026 (Dhū al-Qi'dah 4, 1447)` (EN).
 *
 * ============================================================================
 *   Choix techniques
 * ============================================================================
 * - `pure: false` est OBLIGATOIRE. Avec `pure: true` (défaut), Angular met
 *   en cache le résultat par valeur d'entrée et ne réévalue pas quand la
 *   locale change. Coût : Angular appelle `transform()` à chaque cycle de
 *   change detection — acceptable pour un format de date.
 * - On instancie un seul `DatePipe` (avec locale FR-MA par défaut, surchargée
 *   à chaque appel via le 4e paramètre de `transform()`).
 * - `ngOnDestroy` désabonne proprement pour éviter les fuites mémoire.
 * - Le suffixe hijri est calculé via `HijriCalendarService.formatWithHijri()`
 *   qui retombe silencieusement sur la date grégorienne seule si Intl
 *   `islamic-umalqura` n'est pas supporté par l'engine.
 *
 * @see _locale-resolver.ts
 * @see HijriCalendarService
 */

import { DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  inject,
  OnDestroy,
  Pipe,
  type PipeTransform,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { HijriCalendarService } from '@core/i18n/hijri-calendar.service';

import {
  DEFAULT_PIPE_LOCALE,
  ensurePipeLocalesRegistered,
  resolveLocale,
} from './_locale-resolver';

@Pipe({ name: 'dateLocalized', standalone: true, pure: false })
export class DateLocalizedPipe implements PipeTransform, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  // Phase 4.3 (D3) — suffixe optionnel `(jj mois aaaa hégire)` quand l'utilisateur
  // active le toggle hijri dans son menu profil. `pure: false` garantit que le
  // pipe est ré-évalué à chaque cycle de change detection, donc le résultat
  // suit automatiquement la valeur du signal `hijri.enabled()`.
  private readonly hijri = inject(HijriCalendarService);

  private readonly underlying = new DatePipe(DEFAULT_PIPE_LOCALE);
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
   * @param value     Date instance / ISO string / epoch ms.
   * @param format    Format Angular standard (`'short'`, `'medium'`, `'long'`,
   *                  `'shortDate'`, `'mediumDate'`, `'longDate'`, `'fullDate'`,
   *                  `'shortTime'`, etc.) ou pattern custom (`'dd/MM/yyyy'`).
   *                  Défaut : `'mediumDate'` (cohérent avec le pipe natif).
   * @param timezone  Timezone optionnel (ex. `'UTC'`, `'+0100'`). Si absent,
   *                  utilise le fuseau du navigateur.
   * @returns         Chaîne formatée, ou `null` si la valeur est nulle ou
   *                  non parsable.
   */
  transform(
    value: Date | string | number | null | undefined,
    format: string = 'mediumDate',
    timezone?: string,
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    try {
      const gregorian = this.underlying.transform(value, format, timezone, this.currentLocale);
      if (gregorian === null) {
        return null;
      }
      return this.hijri.formatWithHijri(value, gregorian, this.currentLocale);
    } catch {
      return null;
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
