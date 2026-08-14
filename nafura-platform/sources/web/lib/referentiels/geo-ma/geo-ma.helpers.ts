/**
 * Helpers du référentiel géographique marocain.
 *
 * La recherche par nom est insensible à la casse, aux accents et à la
 * ponctuation légère (apostrophes, tirets) pour rattacher les valeurs
 * legacy saisies en texte libre : `"beni mellal"` → `"Béni Mellal"`,
 * `"Mdiq"` → `"M'diq"`.
 */

import { REGIONS_MA, type RegionMa } from './regions-ma';
import { PROVINCES_MA, type ProvinceMa } from './provinces-ma';
import { VILLES_MA, type VilleMa } from './villes-ma';

/** Normalise un libellé : minuscules, sans accents, sans apostrophes/tirets. */
export function normalizeGeoLabel(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’‘`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VILLES_BY_NORMALIZED = new Map<string, VilleMa>(
  VILLES_MA.map((v) => [normalizeGeoLabel(v.nom), v]),
);
const VILLES_BY_CODE = new Map<string, VilleMa>(VILLES_MA.map((v) => [v.code, v]));
const PROVINCES_BY_CODE = new Map<string, ProvinceMa>(PROVINCES_MA.map((p) => [p.code, p]));
const REGIONS_BY_CODE = new Map<string, RegionMa>(REGIONS_MA.map((r) => [r.code, r]));

/** Retrouve une ville par son slug stable. */
export function findVilleByCode(code: string): VilleMa | undefined {
  return VILLES_BY_CODE.get(code.trim());
}

/**
 * Retrouve une ville par son nom, insensible à la casse et aux accents.
 * Retourne `undefined` si la valeur ne se rattache pas au référentiel.
 */
export function findVilleByNom(nom: string | null | undefined): VilleMa | undefined {
  if (!nom || !nom.trim()) return undefined;
  return VILLES_BY_NORMALIZED.get(normalizeGeoLabel(nom));
}

/** Filtre les villes dont le nom contient la requête (normalisée). */
export function searchVilles(query: string): VilleMa[] {
  const q = normalizeGeoLabel(query);
  if (!q) return [...VILLES_MA];
  return VILLES_MA.filter((v) => normalizeGeoLabel(v.nom).includes(q));
}

/** Villes d'une région, triées alphabétiquement. */
export function villesByRegion(regionCode: string): VilleMa[] {
  const code = regionCode.padStart(2, '0');
  return VILLES_MA.filter((v) => v.regionCode === code).sort((a, b) =>
    a.nom.localeCompare(b.nom, 'fr'),
  );
}

/** Région d'une ville (nom canonique ou approchant). */
export function regionOfVille(nomVille: string): RegionMa | undefined {
  const ville = findVilleByNom(nomVille);
  return ville ? REGIONS_BY_CODE.get(ville.regionCode) : undefined;
}

/** Province / préfecture d'une ville (nom canonique ou approchant). */
export function provinceOfVille(nomVille: string): ProvinceMa | undefined {
  const ville = findVilleByNom(nomVille);
  return ville ? PROVINCES_BY_CODE.get(ville.provinceCode) : undefined;
}

/**
 * Options prêtes pour un select : valeur = nom canonique,
 * libellé = `"Ville — Région"`, tri alphabétique sur le nom.
 */
export function villeSelectOptions(): Array<{ value: string; label: string }> {
  return [...VILLES_MA]
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    .map((v) => ({
      value: v.nom,
      label: `${v.nom} — ${REGIONS_BY_CODE.get(v.regionCode)?.nom ?? v.regionCode}`,
    }));
}

/**
 * Options région pour un select : valeur = code 2 chiffres,
 * libellé = nom officiel.
 */
export function regionSelectOptions(): Array<{ value: string; label: string }> {
  return REGIONS_MA.map((r) => ({ value: r.code, label: r.nom }));
}
