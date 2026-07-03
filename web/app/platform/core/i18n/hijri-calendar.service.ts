/**
 * `HijriCalendarService` — toggle utilisateur pour l'affichage parallèle des
 * dates au calendrier islamique (Umm-al-Qura), Phase 4.3 / Wave D / agent D3.
 *
 * ============================================================================
 *   Pourquoi ce service ?
 * ============================================================================
 * Certains utilisateurs marocains (administration, déclarations DGI/CNSS,
 * jurisprudence MA, contrats avec autorités religieuses) doivent voir la
 * date hégire à côté de la date grégorienne. Le calendrier officiel de
 * l'État marocain pour les usages civils reste grégorien — d'où le choix
 * d'un **affichage parallèle** plutôt que d'un remplacement.
 *
 * Toggle utilisateur dans le menu profil :
 *   - OFF (défaut) → `15/01/2026`
 *   - ON           → `15/01/2026 (25 rajab 1447)`
 *
 * ============================================================================
 *   Choix techniques
 * ============================================================================
 * - **Zéro nouvelle dépendance**. On utilise l'API native `Intl.DateTimeFormat`
 *   avec la BCP-47 extension `-u-ca-islamic-umalqura` qui est supportée par
 *   tous les navigateurs modernes (Chromium ≥ 90, Firefox ≥ 91, Safari ≥ 14).
 *   On évite ainsi `date-fns-jalali`, `moment-hijri` et consorts (~80 KB
 *   gzippés en plus).
 * - **Fallback silencieux** : si l'environnement ne supporte pas
 *   `islamic-umalqura` (vieux navigateurs, JSC limité, certains SSR engines),
 *   `formatHijri()` renvoie `''` et le pipe affiche uniquement la date
 *   grégorienne. Aucune erreur n'est levée vers l'utilisateur.
 * - **Persistance localStorage** (clé `nafura.hijri.enabled`), guardée
 *   try/catch pour rester compatible SSR / quota saturé / mode privé Safari.
 * - **Signal `WritableSignal<boolean>`** pour réactivité fine : les pipes
 *   `dateLocalized` (`pure: false`) re-rendent automatiquement au prochain
 *   cycle de change detection après `setEnabled()`/`toggle()`.
 *
 * ============================================================================
 *   AR / RTL Round 2
 * ============================================================================
 * Quand AR sera activée (Phase 6+), le toggle restera utile : même quand
 * la langue est `ar`, l'utilisateur peut vouloir voir grégorien + hégire
 * en parallèle. Aucun changement nécessaire dans ce service à ce moment-là.
 */

import { computed, Injectable, signal } from '@angular/core';

/** Clé `localStorage` où l'état du toggle est persisté. */
export const HIJRI_ENABLED_STORAGE_KEY = 'nafura.hijri.enabled';

/** Locale BCP-47 utilisée pour le formatage hégire (extension `-u-ca-islamic-umalqura`). */
const HIJRI_CALENDAR_EXTENSION = 'u-ca-islamic-umalqura';

/** Locale de repli si l'appelant n'en fournit aucune. */
const DEFAULT_HIJRI_BASE_LOCALE = 'fr-MA';

@Injectable({ providedIn: 'root' })
export class HijriCalendarService {
  private readonly _enabled = signal<boolean>(this.loadFromStorage());

  /** Signal lecture seule : `true` si l'utilisateur a activé l'affichage parallèle hégire. */
  readonly enabled = computed(() => this._enabled());

  /** Bascule l'état (ON ↔ OFF) et persiste dans `localStorage`. */
  toggle(): void {
    const next = !this._enabled();
    this._enabled.set(next);
    this.persist(next);
  }

  /** Force l'état du toggle et persiste. */
  setEnabled(value: boolean): void {
    this._enabled.set(value);
    this.persist(value);
  }

  /**
   * Formate une date au calendrier islamique Umm-al-Qura.
   *
   * @param date   Date | ISO string | epoch ms.
   * @param locale Locale de base (FR / EN — on force l'extension `-u-ca-islamic-umalqura`).
   *               Défaut : `fr-MA`.
   * @returns      Chaîne formatée (ex. `"25 rajab 1447"` en FR,
   *               `"Rajab 25, 1447"` en EN), ou `''` si la date est
   *               invalide ou si l'environnement ne supporte pas le
   *               calendrier islamique.
   */
  formatHijri(
    date: Date | string | number | null | undefined,
    locale: string = DEFAULT_HIJRI_BASE_LOCALE,
  ): string {
    if (date === null || date === undefined || date === '') {
      return '';
    }
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(d.getTime())) {
        return '';
      }
      const base = this.extractBaseLocale(locale);
      const hijriLocale = `${base}-${HIJRI_CALENDAR_EXTENSION}`;
      return new Intl.DateTimeFormat(hijriLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return '';
    }
  }

  /**
   * Combine la date grégorienne déjà formatée avec la version hégire si
   * l'utilisateur a activé le toggle.
   *
   * @param date              Date d'origine (instance / ISO / epoch).
   * @param gregorianFormatted Sortie déjà formatée par `DatePipe` (ou autre).
   * @param locale            Locale BCP-47 résolue (`fr-MA` / `en-US` / ...).
   * @returns                 `gregorianFormatted` si le toggle est OFF.
   *                          `gregorianFormatted + " (" + hijri + ")"` si ON
   *                          et `formatHijri` renvoie une chaîne non vide.
   *                          `gregorianFormatted` si ON mais Intl indisponible.
   */
  formatWithHijri(
    date: Date | string | number | null | undefined,
    gregorianFormatted: string,
    locale: string = DEFAULT_HIJRI_BASE_LOCALE,
  ): string {
    if (!this._enabled()) {
      return gregorianFormatted;
    }
    const hijri = this.formatHijri(date, locale);
    return hijri ? `${gregorianFormatted} (${hijri})` : gregorianFormatted;
  }

  /**
   * Extrait la base ISO 639-1 (`fr`, `en`, `ar`) d'une locale BCP-47 et
   * retourne `<base>-MA` pour FR/AR (pour rester aligné MA) ou `<base>-SA`
   * absent — on garde la locale d'entrée comme base et on append juste
   * l'extension calendar. Comportement défensif : si la locale est vide
   * ou non parsable, retombe sur `fr-MA`.
   */
  private extractBaseLocale(locale: string): string {
    if (!locale || typeof locale !== 'string') {
      return DEFAULT_HIJRI_BASE_LOCALE;
    }
    // Strip any pre-existing `-u-…` extension to éviter conflits.
    const withoutExtension = locale.split('-u-')[0];
    return withoutExtension || DEFAULT_HIJRI_BASE_LOCALE;
  }

  private loadFromStorage(): boolean {
    try {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      return localStorage.getItem(HIJRI_ENABLED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persist(value: boolean): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(HIJRI_ENABLED_STORAGE_KEY, String(value));
    } catch {
      // SSR / quota saturé / mode privé Safari — silencieux.
    }
  }
}
