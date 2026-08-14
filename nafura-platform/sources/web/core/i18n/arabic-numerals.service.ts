/**
 * `ArabicNumeralsService` — toggle utilisateur pour l'affichage des chiffres
 * en écriture arabe (Arabic-Indic, ٠-٩) en lieu et place des chiffres
 * occidentaux (Western, 0-9). Round 2 Phase 2 sub-C (squelette AR + RTL).
 *
 * ============================================================================
 *   Pourquoi ce service ?
 * ============================================================================
 * Quand l'utilisateur est en langue `ar`, certains contextes (lecture longue,
 * documents juridiques, lectures par utilisateurs maghrébins âgés) préfèrent
 * les chiffres en écriture arabe `٠١٢٣٤٥٦٧٨٩` plutôt que les chiffres
 * occidentaux (qui sont, paradoxalement, d'origine indienne). Le format
 * officiel marocain (administration, comptabilité, factures) reste en
 * chiffres occidentaux — d'où le choix d'un **toggle opt-in OFF par
 * défaut**, similaire au `HijriCalendarService`.
 *
 * ============================================================================
 *   Choix techniques
 * ============================================================================
 * - **Zéro dépendance**. Conversion par `replace` + `String.fromCharCode`
 *   sur la plage Unicode `U+0660`..`U+0669` (Arabic-Indic Digits).
 * - **Persistance localStorage** (clé `nafura.numerals.arabic-indic`),
 *   guardée try/catch (SSR, quota, mode privé Safari).
 * - **Signal `WritableSignal<boolean>`** pour réactivité fine ; les pipes
 *   numériques (`numberLocalized`, `currencyLocalized`) peuvent consommer
 *   `enabled()` et re-rendre.
 * - **Idempotent** : `formatNumeric()` sur une chaîne déjà convertie
 *   (contenant `٠-٩`) la renvoie inchangée — `replace(/[0-9]/g, …)` ne
 *   matche que les digits occidentaux.
 *
 * @see HijriCalendarService — pattern jumeau pour l'affichage parallèle hégire.
 */

import { computed, Injectable, signal } from '@angular/core';

/** Clé `localStorage` où l'état du toggle est persisté. */
export const ARABIC_NUMERALS_STORAGE_KEY = 'nafura.numerals.arabic-indic';

/** Code Unicode du chiffre arabe `٠` (Arabic-Indic Digit Zero). */
const ARABIC_INDIC_ZERO_CODEPOINT = 0x0660;

@Injectable({ providedIn: 'root' })
export class ArabicNumeralsService {
  private readonly _enabled = signal<boolean>(this.loadFromStorage());

  /** Signal lecture seule : `true` si l'utilisateur a activé les chiffres arabes. */
  readonly enabled = computed(() => this._enabled());

  /** Bascule l'état (ON ↔ OFF) et persiste. */
  toggle(): void {
    this.setEnabled(!this._enabled());
  }

  /** Force l'état du toggle et persiste. */
  setEnabled(value: boolean): void {
    this._enabled.set(value);
    this.persist(value);
  }

  /**
   * Convertit les chiffres occidentaux (0-9) en chiffres arabes (٠-٩)
   * **uniquement** si le toggle est ON. Sinon renvoie la chaîne inchangée.
   *
   * @param text  Chaîne pouvant contenir des digits occidentaux.
   * @returns     Chaîne convertie si toggle ON, sinon `text` tel quel.
   */
  formatNumeric(text: string): string {
    if (!this._enabled()) {
      return text;
    }
    if (!text) {
      return text;
    }
    return text.replace(/[0-9]/g, (d) =>
      String.fromCharCode(ARABIC_INDIC_ZERO_CODEPOINT + Number.parseInt(d, 10)),
    );
  }

  private loadFromStorage(): boolean {
    try {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      return localStorage.getItem(ARABIC_NUMERALS_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persist(value: boolean): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(ARABIC_NUMERALS_STORAGE_KEY, String(value));
    } catch {
      // SSR / quota saturé / mode privé Safari — silencieux.
    }
  }
}
