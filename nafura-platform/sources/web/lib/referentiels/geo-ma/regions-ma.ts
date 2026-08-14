/**
 * Référentiel administratif marocain — 12 régions (découpage 2015).
 *
 * Source : Haut-Commissariat au Plan, loi organique n° 111-14 sur les
 * régions. Les codes officiels ANCFCC (Cadastre) sont à 2 chiffres.
 *
 * Les provinces / préfectures sont portées par `PROVINCES_MA`
 * (provinces-ma.ts) et référencées ici par `regionCode`.
 */

export interface RegionMa {
  /** Code 2 chiffres ANCFCC. */
  code: string;
  /** Nom français officiel. */
  nom: string;
  /** Nom arabe (translittération latine). */
  nomAr?: string;
  /** Chef-lieu administratif (nom canonique de ville, cf. VILLES_MA). */
  chefLieu: string;
}

export const REGIONS_MA: readonly RegionMa[] = [
  { code: '01', nom: 'Tanger-Tétouan-Al Hoceïma', nomAr: 'Tanjah-Tétouan-Al Hoceïma', chefLieu: 'Tanger' },
  { code: '02', nom: 'Oriental', nomAr: 'Ach-Charqia', chefLieu: 'Oujda' },
  { code: '03', nom: 'Fès-Meknès', nomAr: 'Fas-Meknès', chefLieu: 'Fès' },
  { code: '04', nom: 'Rabat-Salé-Kénitra', nomAr: 'Ar-Ribat-Sla-Kénitra', chefLieu: 'Rabat' },
  { code: '05', nom: 'Béni Mellal-Khénifra', nomAr: 'Beni Mellal-Khénifra', chefLieu: 'Béni Mellal' },
  { code: '06', nom: 'Casablanca-Settat', nomAr: 'Ad-Dar Al Bayda-Settat', chefLieu: 'Casablanca' },
  { code: '07', nom: 'Marrakech-Safi', nomAr: 'Marrakech-Safi', chefLieu: 'Marrakech' },
  { code: '08', nom: 'Drâa-Tafilalet', nomAr: 'Daraa-Tafilalt', chefLieu: 'Errachidia' },
  { code: '09', nom: 'Souss-Massa', nomAr: 'Souss-Massa', chefLieu: 'Agadir' },
  { code: '10', nom: 'Guelmim-Oued Noun', nomAr: 'Guelmim-Oued Noun', chefLieu: 'Guelmim' },
  { code: '11', nom: 'Laâyoune-Sakia El Hamra', nomAr: 'Al Aaiun-Saqiya Al Hamra', chefLieu: 'Laâyoune' },
  { code: '12', nom: 'Dakhla-Oued Ed-Dahab', nomAr: 'Ad-Dakhla-Oued Ed-Dahab', chefLieu: 'Dakhla' },
];

export function findRegionByCode(code: string): RegionMa | undefined {
  return REGIONS_MA.find((r) => r.code === code.padStart(2, '0'));
}

export function findRegionByName(name: string): RegionMa | undefined {
  const target = name.trim().toLowerCase();
  return REGIONS_MA.find((r) => r.nom.toLowerCase() === target);
}
