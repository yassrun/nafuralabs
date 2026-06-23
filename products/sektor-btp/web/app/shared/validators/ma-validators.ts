/**
 * Validateurs Maroc — ICE, RIB, IF, CNSS, AMO, Patente, RC.
 *
 * Réf. : Code Général des Impôts (CGI) — Maroc.
 *  - ICE : 15 chiffres (Identifiant Commun de l'Entreprise) — décret 2-11-13.
 *  - IF  : 7 ou 8 chiffres (Identifiant Fiscal entreprises).
 *  - RIB : 24 chiffres = banque(3) + agence(5) + compte(14) + clé(2),
 *          clé contrôlée via reste de division par 97
 *          (concat(banque+agence+compte+clé) mod 97 ≡ 0).
 *  - CNSS : matricule employeur 7 chiffres ; affilié 7-9 chiffres.
 *  - AMO  : numéro AMO (couverture santé) 7-9 chiffres.
 *  - Patente : numéro 7-10 chiffres.
 *  - RC  : numéro RC 4-8 chiffres (variable selon tribunal).
 *
 * Toutes les fonctions sont pures + déterministes — utilisables directement
 * dans `Validators.compose(...)` Angular ou en standalone (tests, mocks).
 */

import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const ONLY_DIGITS_RE = /^\d+$/;

export function stripNonDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

// ────────────────────────────────────────────────────────────────────────────
// ICE — Identifiant Commun de l'Entreprise (15 chiffres)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Valide un ICE : 15 chiffres exactement.
 *
 * Note : la DGI ne publie pas d'algorithme de clé officielle pour l'ICE ;
 * on contrôle la longueur exacte et l'absence de caractères non-numériques.
 */
export function isValidIce(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = stripNonDigits(raw);
  return digits.length === 15 && ONLY_DIGITS_RE.test(digits);
}

export function iceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    return isValidIce(v) ? null : { ice: { message: 'ICE invalide — 15 chiffres requis', actual: stripNonDigits(v).length } };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// RIB — Relevé d'Identité Bancaire MA (24 chiffres + clé 97)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calcule la clé RIB (2 chiffres) à partir des 22 premiers chiffres
 * `banque(3) + agence(5) + compte(14)`.
 *
 * Algorithme : `clé = 97 - (N · 100 mod 97)` où `N` = 22 chiffres lus comme entier.
 * Equivalent à `(N · 100 + clé) mod 97 = 0`.
 */
export function computeRibKey(banque: string, agence: string, compte: string): string {
  const b = stripNonDigits(banque).padStart(3, '0').slice(-3);
  const a = stripNonDigits(agence).padStart(5, '0').slice(-5);
  const c = stripNonDigits(compte).padStart(14, '0').slice(-14);
  const concat22 = b + a + c;
  // Calcul itératif modulo 97 pour éviter le dépassement Number sur 22 chiffres.
  let rem = 0;
  for (const ch of concat22 + '00') {
    rem = (rem * 10 + Number(ch)) % 97;
  }
  const key = 97 - rem;
  return String(key).padStart(2, '0');
}

/**
 * Valide un RIB MA :
 *  - 24 chiffres exactement
 *  - Clé (2 derniers) doit correspondre à `computeRibKey(banque, agence, compte)`
 *
 * Si `strictKey === false`, seul le format 24 chiffres est vérifié.
 */
export function isValidRib(raw: string | null | undefined, strictKey = true): boolean {
  if (!raw) return false;
  const digits = stripNonDigits(raw);
  if (digits.length !== 24) return false;
  if (!strictKey) return true;
  const banque = digits.slice(0, 3);
  const agence = digits.slice(3, 8);
  const compte = digits.slice(8, 22);
  const cle = digits.slice(22, 24);
  return computeRibKey(banque, agence, compte) === cle;
}

export function ribValidator(options?: { strictKey?: boolean }): ValidatorFn {
  const strict = options?.strictKey ?? false; // par défaut : tolérant (RIB seed démo)
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    if (!isValidRib(v, strict)) {
      const digits = stripNonDigits(v);
      if (digits.length !== 24) {
        return { rib: { message: 'RIB invalide — 24 chiffres requis', actual: digits.length } };
      }
      return { rib: { message: 'Clé RIB invalide — vérifiez le numéro saisi', actual: digits.slice(-2) } };
    }
    return null;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// IF — Identifiant Fiscal (7 ou 8 chiffres)
// ────────────────────────────────────────────────────────────────────────────

export function isValidIf(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = stripNonDigits(raw);
  return (digits.length === 7 || digits.length === 8) && ONLY_DIGITS_RE.test(digits);
}

export function ifValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    return isValidIf(v) ? null : { if: { message: 'IF invalide — 7 ou 8 chiffres', actual: stripNonDigits(v).length } };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// CNSS — Caisse Nationale de Sécurité Sociale
// ────────────────────────────────────────────────────────────────────────────

/**
 * Matricule CNSS (7 chiffres employeur, 7–9 chiffres affilié selon ancienneté).
 */
export function isValidCnss(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = stripNonDigits(raw);
  return digits.length >= 7 && digits.length <= 9 && ONLY_DIGITS_RE.test(digits);
}

export function cnssValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    return isValidCnss(v) ? null : { cnss: { message: 'Matricule CNSS invalide — 7 à 9 chiffres', actual: stripNonDigits(v).length } };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// AMO — Assurance Maladie Obligatoire (7-9 chiffres)
// ────────────────────────────────────────────────────────────────────────────

export function isValidAmo(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = stripNonDigits(raw);
  return digits.length >= 7 && digits.length <= 9 && ONLY_DIGITS_RE.test(digits);
}

export function amoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    return isValidAmo(v) ? null : { amo: { message: 'N° AMO invalide — 7 à 9 chiffres', actual: stripNonDigits(v).length } };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Patente — Taxe professionnelle (7-10 chiffres)
// ────────────────────────────────────────────────────────────────────────────

export function isValidPatente(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = stripNonDigits(raw);
  return digits.length >= 7 && digits.length <= 10 && ONLY_DIGITS_RE.test(digits);
}

export function patenteValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    return isValidPatente(v) ? null : { patente: { message: 'N° patente invalide — 7 à 10 chiffres' } };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// RC — Registre de Commerce (numéro)
// ────────────────────────────────────────────────────────────────────────────

/**
 * RC : numéro variable 4-8 chiffres selon tribunal (Casa, Rabat…) + ville.
 * Ici on contrôle juste qu'il y ait au moins 4 chiffres.
 */
export function isValidRc(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = stripNonDigits(raw);
  return digits.length >= 4 && digits.length <= 8 && ONLY_DIGITS_RE.test(digits);
}

export function rcValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    return isValidRc(v) ? null : { rc: { message: 'N° RC invalide — 4 à 8 chiffres' } };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Téléphone MA — `+212` ou `0` + 9 chiffres commençant par 5/6/7
// ────────────────────────────────────────────────────────────────────────────

const MA_PHONE_E164_RE = /^\+212[567]\d{8}$/;

export function isValidPhoneMa(raw: string | null | undefined): boolean {
  if (!raw) return false;
  // tolère "06 12 34 56 78", "+212 6 12 …", "00212 6 12 …"
  let digits = (raw + '').replace(/[^\d+]/g, '');
  if (digits.startsWith('00212')) digits = '+212' + digits.slice(5);
  else if (digits.startsWith('212')) digits = '+212' + digits.slice(3);
  else if (digits.startsWith('0')) digits = '+212' + digits.slice(1);
  return MA_PHONE_E164_RE.test(digits);
}

export function phoneMaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string | null;
    if (v == null || v === '') return null;
    return isValidPhoneMa(v) ? null : { phoneMa: { message: 'Numéro marocain invalide — format +212 6/7 XX XX XX XX' } };
  };
}
