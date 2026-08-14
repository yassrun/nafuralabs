/**
 * Référentiel administratif marocain — 75 provinces et préfectures
 * (découpage 2015, Haut-Commissariat au Plan).
 *
 * `code` est un slug stable en kebab-case (même convention que les ids de
 * `banques-ma`). `regionCode` référence `REGIONS_MA`.
 */

export type ProvinceMaType = 'PROVINCE' | 'PREFECTURE';

export interface ProvinceMa {
  /** Slug stable, kebab-case. */
  code: string;
  /** Nom français officiel. */
  nom: string;
  /** Code de la région (cf. REGIONS_MA). */
  regionCode: string;
  /** Province ou préfecture. */
  type: ProvinceMaType;
}

export const PROVINCES_MA: readonly ProvinceMa[] = [
  // ── 01 Tanger-Tétouan-Al Hoceïma ──────────────────────────────────────
  { code: 'tanger-assilah', nom: 'Tanger-Assilah', regionCode: '01', type: 'PREFECTURE' },
  { code: 'mdiq-fnideq', nom: "M'diq-Fnideq", regionCode: '01', type: 'PREFECTURE' },
  { code: 'tetouan', nom: 'Tétouan', regionCode: '01', type: 'PROVINCE' },
  { code: 'fahs-anjra', nom: 'Fahs-Anjra', regionCode: '01', type: 'PROVINCE' },
  { code: 'larache', nom: 'Larache', regionCode: '01', type: 'PROVINCE' },
  { code: 'al-hoceima', nom: 'Al Hoceïma', regionCode: '01', type: 'PROVINCE' },
  { code: 'chefchaouen', nom: 'Chefchaouen', regionCode: '01', type: 'PROVINCE' },
  { code: 'ouezzane', nom: 'Ouezzane', regionCode: '01', type: 'PROVINCE' },

  // ── 02 Oriental ───────────────────────────────────────────────────────
  { code: 'oujda-angad', nom: 'Oujda-Angad', regionCode: '02', type: 'PREFECTURE' },
  { code: 'nador', nom: 'Nador', regionCode: '02', type: 'PROVINCE' },
  { code: 'driouch', nom: 'Driouch', regionCode: '02', type: 'PROVINCE' },
  { code: 'jerada', nom: 'Jerada', regionCode: '02', type: 'PROVINCE' },
  { code: 'berkane', nom: 'Berkane', regionCode: '02', type: 'PROVINCE' },
  { code: 'taourirt', nom: 'Taourirt', regionCode: '02', type: 'PROVINCE' },
  { code: 'guercif', nom: 'Guercif', regionCode: '02', type: 'PROVINCE' },
  { code: 'figuig', nom: 'Figuig', regionCode: '02', type: 'PROVINCE' },

  // ── 03 Fès-Meknès ─────────────────────────────────────────────────────
  { code: 'fes', nom: 'Fès', regionCode: '03', type: 'PREFECTURE' },
  { code: 'meknes', nom: 'Meknès', regionCode: '03', type: 'PREFECTURE' },
  { code: 'el-hajeb', nom: 'El Hajeb', regionCode: '03', type: 'PROVINCE' },
  { code: 'ifrane', nom: 'Ifrane', regionCode: '03', type: 'PROVINCE' },
  { code: 'moulay-yacoub', nom: 'Moulay Yacoub', regionCode: '03', type: 'PROVINCE' },
  { code: 'sefrou', nom: 'Sefrou', regionCode: '03', type: 'PROVINCE' },
  { code: 'boulemane', nom: 'Boulemane', regionCode: '03', type: 'PROVINCE' },
  { code: 'taounate', nom: 'Taounate', regionCode: '03', type: 'PROVINCE' },
  { code: 'taza', nom: 'Taza', regionCode: '03', type: 'PROVINCE' },

  // ── 04 Rabat-Salé-Kénitra ─────────────────────────────────────────────
  { code: 'rabat', nom: 'Rabat', regionCode: '04', type: 'PREFECTURE' },
  { code: 'sale', nom: 'Salé', regionCode: '04', type: 'PREFECTURE' },
  { code: 'skhirate-temara', nom: 'Skhirate-Témara', regionCode: '04', type: 'PREFECTURE' },
  { code: 'kenitra', nom: 'Kénitra', regionCode: '04', type: 'PROVINCE' },
  { code: 'khemisset', nom: 'Khémisset', regionCode: '04', type: 'PROVINCE' },
  { code: 'sidi-kacem', nom: 'Sidi Kacem', regionCode: '04', type: 'PROVINCE' },
  { code: 'sidi-slimane', nom: 'Sidi Slimane', regionCode: '04', type: 'PROVINCE' },

  // ── 05 Béni Mellal-Khénifra ───────────────────────────────────────────
  { code: 'beni-mellal', nom: 'Béni Mellal', regionCode: '05', type: 'PROVINCE' },
  { code: 'azilal', nom: 'Azilal', regionCode: '05', type: 'PROVINCE' },
  { code: 'fquih-ben-salah', nom: 'Fquih Ben Salah', regionCode: '05', type: 'PROVINCE' },
  { code: 'khenifra', nom: 'Khénifra', regionCode: '05', type: 'PROVINCE' },
  { code: 'khouribga', nom: 'Khouribga', regionCode: '05', type: 'PROVINCE' },

  // ── 06 Casablanca-Settat ──────────────────────────────────────────────
  { code: 'casablanca', nom: 'Casablanca', regionCode: '06', type: 'PREFECTURE' },
  { code: 'mohammedia', nom: 'Mohammédia', regionCode: '06', type: 'PREFECTURE' },
  { code: 'el-jadida', nom: 'El Jadida', regionCode: '06', type: 'PROVINCE' },
  { code: 'nouaceur', nom: 'Nouaceur', regionCode: '06', type: 'PROVINCE' },
  { code: 'mediouna', nom: 'Médiouna', regionCode: '06', type: 'PROVINCE' },
  { code: 'benslimane', nom: 'Benslimane', regionCode: '06', type: 'PROVINCE' },
  { code: 'berrechid', nom: 'Berrechid', regionCode: '06', type: 'PROVINCE' },
  { code: 'settat', nom: 'Settat', regionCode: '06', type: 'PROVINCE' },
  { code: 'sidi-bennour', nom: 'Sidi Bennour', regionCode: '06', type: 'PROVINCE' },

  // ── 07 Marrakech-Safi ─────────────────────────────────────────────────
  { code: 'marrakech', nom: 'Marrakech', regionCode: '07', type: 'PREFECTURE' },
  { code: 'chichaoua', nom: 'Chichaoua', regionCode: '07', type: 'PROVINCE' },
  { code: 'al-haouz', nom: 'Al Haouz', regionCode: '07', type: 'PROVINCE' },
  { code: 'el-kelaa-des-sraghna', nom: 'El Kelâa des Sraghna', regionCode: '07', type: 'PROVINCE' },
  { code: 'essaouira', nom: 'Essaouira', regionCode: '07', type: 'PROVINCE' },
  { code: 'rehamna', nom: 'Rehamna', regionCode: '07', type: 'PROVINCE' },
  { code: 'safi', nom: 'Safi', regionCode: '07', type: 'PROVINCE' },
  { code: 'youssoufia', nom: 'Youssoufia', regionCode: '07', type: 'PROVINCE' },

  // ── 08 Drâa-Tafilalet ─────────────────────────────────────────────────
  { code: 'errachidia', nom: 'Errachidia', regionCode: '08', type: 'PROVINCE' },
  { code: 'ouarzazate', nom: 'Ouarzazate', regionCode: '08', type: 'PROVINCE' },
  { code: 'midelt', nom: 'Midelt', regionCode: '08', type: 'PROVINCE' },
  { code: 'tinghir', nom: 'Tinghir', regionCode: '08', type: 'PROVINCE' },
  { code: 'zagora', nom: 'Zagora', regionCode: '08', type: 'PROVINCE' },

  // ── 09 Souss-Massa ────────────────────────────────────────────────────
  { code: 'agadir-ida-outanane', nom: 'Agadir Ida-Outanane', regionCode: '09', type: 'PREFECTURE' },
  { code: 'inezgane-ait-melloul', nom: 'Inezgane-Aït Melloul', regionCode: '09', type: 'PREFECTURE' },
  { code: 'chtouka-ait-baha', nom: 'Chtouka-Aït Baha', regionCode: '09', type: 'PROVINCE' },
  { code: 'taroudant', nom: 'Taroudant', regionCode: '09', type: 'PROVINCE' },
  { code: 'tiznit', nom: 'Tiznit', regionCode: '09', type: 'PROVINCE' },
  { code: 'tata', nom: 'Tata', regionCode: '09', type: 'PROVINCE' },

  // ── 10 Guelmim-Oued Noun ──────────────────────────────────────────────
  { code: 'guelmim', nom: 'Guelmim', regionCode: '10', type: 'PROVINCE' },
  { code: 'assa-zag', nom: 'Assa-Zag', regionCode: '10', type: 'PROVINCE' },
  { code: 'tan-tan', nom: 'Tan-Tan', regionCode: '10', type: 'PROVINCE' },
  { code: 'sidi-ifni', nom: 'Sidi Ifni', regionCode: '10', type: 'PROVINCE' },

  // ── 11 Laâyoune-Sakia El Hamra ────────────────────────────────────────
  { code: 'laayoune', nom: 'Laâyoune', regionCode: '11', type: 'PROVINCE' },
  { code: 'boujdour', nom: 'Boujdour', regionCode: '11', type: 'PROVINCE' },
  { code: 'tarfaya', nom: 'Tarfaya', regionCode: '11', type: 'PROVINCE' },
  { code: 'es-semara', nom: 'Es-Semara', regionCode: '11', type: 'PROVINCE' },

  // ── 12 Dakhla-Oued Ed-Dahab ───────────────────────────────────────────
  { code: 'oued-ed-dahab', nom: 'Oued Ed-Dahab', regionCode: '12', type: 'PROVINCE' },
  { code: 'aousserd', nom: 'Aousserd', regionCode: '12', type: 'PROVINCE' },
];

export function findProvinceByCode(code: string): ProvinceMa | undefined {
  return PROVINCES_MA.find((p) => p.code === code);
}

export function provincesByRegion(regionCode: string): ProvinceMa[] {
  const code = regionCode.padStart(2, '0');
  return PROVINCES_MA.filter((p) => p.regionCode === code);
}
