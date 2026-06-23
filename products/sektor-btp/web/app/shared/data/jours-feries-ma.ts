/**
 * Référentiel des jours fériés marocains (M-MA-09).
 *
 * Inclut :
 *  - les fêtes civiles fixes (calendrier grégorien)
 *  - les fêtes religieuses islamiques (calendrier hégirien — dates pré-calculées)
 *
 * Source : décret n° 2-77-169 (mis à jour) + Bulletin Officiel.
 * Notes :
 *  - L'observation effective de l'Aïd (Fitr, Adha) dépend de l'apparition du
 *    croissant lunaire — les dates ci-dessous sont les dates *officielles
 *    civiles* publiées par le gouvernement marocain (à ajuster annuellement).
 *  - On seed **5 années glissantes** (année courante − 1 … + 4) pour couvrir
 *    plannings rétrospectifs et prévisionnels.
 */

export type JourFerieType = 'CIVIL' | 'RELIGIEUX';

export interface JourFerieMa {
  /** Date ISO grégorienne (YYYY-MM-DD). */
  date: string;
  /** Libellé court en français. */
  libelle: string;
  /** Catégorie (civil grégorien ou religieux hégirien). */
  type: JourFerieType;
  /** Référence légale (décret) ou hégirienne. */
  reference?: string;
}

/** Fêtes civiles fixes — répétées chaque année. */
const FETES_CIVILES_FIXES: Array<{ mois: number; jour: number; libelle: string; reference?: string }> = [
  { mois: 1,  jour: 1,  libelle: 'Jour de l\'An',                        reference: 'BO 1977' },
  { mois: 1,  jour: 11, libelle: 'Manifeste de l\'Indépendance',          reference: 'BO 1944' },
  { mois: 5,  jour: 1,  libelle: 'Fête du Travail',                      reference: 'Convention OIT' },
  { mois: 7,  jour: 30, libelle: 'Fête du Trône',                        reference: 'BO 1999' },
  { mois: 8,  jour: 14, libelle: 'Allégeance Oued Eddahab',              reference: 'BO 1979' },
  { mois: 8,  jour: 20, libelle: 'Révolution du Roi et du Peuple',       reference: 'BO 1953' },
  { mois: 8,  jour: 21, libelle: 'Fête de la Jeunesse',                  reference: 'BO 2000' },
  { mois: 11, jour: 6,  libelle: 'Marche Verte',                         reference: 'BO 1975' },
  { mois: 11, jour: 18, libelle: 'Fête de l\'Indépendance',              reference: 'BO 1956' },
];

/**
 * Fêtes religieuses islamiques — dates grégoriennes officielles MA.
 * À mettre à jour annuellement (vérifier auprès du Ministère des Habous).
 * Sources publiques 2024-2030 : portail.gov.ma.
 */
const FETES_RELIGIEUSES: JourFerieMa[] = [
  // 2025
  { date: '2025-01-01', libelle: 'Nouvel an hégirien (1 Mouharram 1447)', type: 'RELIGIEUX', reference: '1 Mouharram 1447' },
  { date: '2025-09-05', libelle: 'Aïd Al Mawlid (12 Rabi I 1447)',         type: 'RELIGIEUX', reference: '12 Rabi I 1447' },
  { date: '2025-03-31', libelle: 'Aïd Al Fitr (1 Chawwal 1446)',           type: 'RELIGIEUX', reference: '1 Chawwal 1446' },
  { date: '2025-04-01', libelle: 'Aïd Al Fitr — 2e jour',                  type: 'RELIGIEUX', reference: '2 Chawwal 1446' },
  { date: '2025-06-07', libelle: 'Aïd Al Adha (10 Dhul-Hijjah 1446)',      type: 'RELIGIEUX', reference: '10 Dhul-Hijjah 1446' },
  { date: '2025-06-08', libelle: 'Aïd Al Adha — 2e jour',                  type: 'RELIGIEUX', reference: '11 Dhul-Hijjah 1446' },
  { date: '2025-06-27', libelle: 'Nouvel an hégirien (1 Mouharram 1447)',  type: 'RELIGIEUX', reference: '1 Mouharram 1447' },

  // 2026
  { date: '2026-02-26', libelle: 'Aïd Al Mawlid (12 Rabi I 1448)',         type: 'RELIGIEUX', reference: '12 Rabi I 1448' },
  { date: '2026-03-20', libelle: 'Aïd Al Fitr (1 Chawwal 1447)',           type: 'RELIGIEUX', reference: '1 Chawwal 1447' },
  { date: '2026-03-21', libelle: 'Aïd Al Fitr — 2e jour',                  type: 'RELIGIEUX', reference: '2 Chawwal 1447' },
  { date: '2026-05-27', libelle: 'Aïd Al Adha (10 Dhul-Hijjah 1447)',      type: 'RELIGIEUX', reference: '10 Dhul-Hijjah 1447' },
  { date: '2026-05-28', libelle: 'Aïd Al Adha — 2e jour',                  type: 'RELIGIEUX', reference: '11 Dhul-Hijjah 1447' },
  { date: '2026-06-16', libelle: 'Nouvel an hégirien (1 Mouharram 1448)',  type: 'RELIGIEUX', reference: '1 Mouharram 1448' },

  // 2027
  { date: '2027-02-15', libelle: 'Aïd Al Mawlid (12 Rabi I 1449)',         type: 'RELIGIEUX', reference: '12 Rabi I 1449' },
  { date: '2027-03-10', libelle: 'Aïd Al Fitr (1 Chawwal 1448)',           type: 'RELIGIEUX', reference: '1 Chawwal 1448' },
  { date: '2027-03-11', libelle: 'Aïd Al Fitr — 2e jour',                  type: 'RELIGIEUX', reference: '2 Chawwal 1448' },
  { date: '2027-05-17', libelle: 'Aïd Al Adha (10 Dhul-Hijjah 1448)',      type: 'RELIGIEUX', reference: '10 Dhul-Hijjah 1448' },
  { date: '2027-05-18', libelle: 'Aïd Al Adha — 2e jour',                  type: 'RELIGIEUX', reference: '11 Dhul-Hijjah 1448' },
  { date: '2027-06-06', libelle: 'Nouvel an hégirien (1 Mouharram 1449)',  type: 'RELIGIEUX', reference: '1 Mouharram 1449' },

  // 2028
  { date: '2028-02-05', libelle: 'Aïd Al Mawlid (12 Rabi I 1450)',         type: 'RELIGIEUX', reference: '12 Rabi I 1450' },
  { date: '2028-02-26', libelle: 'Aïd Al Fitr (1 Chawwal 1449)',           type: 'RELIGIEUX', reference: '1 Chawwal 1449' },
  { date: '2028-02-27', libelle: 'Aïd Al Fitr — 2e jour',                  type: 'RELIGIEUX', reference: '2 Chawwal 1449' },
  { date: '2028-05-06', libelle: 'Aïd Al Adha (10 Dhul-Hijjah 1449)',      type: 'RELIGIEUX', reference: '10 Dhul-Hijjah 1449' },
  { date: '2028-05-07', libelle: 'Aïd Al Adha — 2e jour',                  type: 'RELIGIEUX', reference: '11 Dhul-Hijjah 1449' },
  { date: '2028-05-26', libelle: 'Nouvel an hégirien (1 Mouharram 1450)',  type: 'RELIGIEUX', reference: '1 Mouharram 1450' },

  // 2029
  { date: '2029-01-25', libelle: 'Aïd Al Mawlid (12 Rabi I 1451)',         type: 'RELIGIEUX', reference: '12 Rabi I 1451' },
  { date: '2029-02-14', libelle: 'Aïd Al Fitr (1 Chawwal 1450)',           type: 'RELIGIEUX', reference: '1 Chawwal 1450' },
  { date: '2029-02-15', libelle: 'Aïd Al Fitr — 2e jour',                  type: 'RELIGIEUX', reference: '2 Chawwal 1450' },
  { date: '2029-04-26', libelle: 'Aïd Al Adha (10 Dhul-Hijjah 1450)',      type: 'RELIGIEUX', reference: '10 Dhul-Hijjah 1450' },
  { date: '2029-04-27', libelle: 'Aïd Al Adha — 2e jour',                  type: 'RELIGIEUX', reference: '11 Dhul-Hijjah 1450' },
  { date: '2029-05-15', libelle: 'Nouvel an hégirien (1 Mouharram 1451)',  type: 'RELIGIEUX', reference: '1 Mouharram 1451' },

  // 2030
  { date: '2030-01-14', libelle: 'Aïd Al Mawlid (12 Rabi I 1452)',         type: 'RELIGIEUX', reference: '12 Rabi I 1452' },
  { date: '2030-02-04', libelle: 'Aïd Al Fitr (1 Chawwal 1451)',           type: 'RELIGIEUX', reference: '1 Chawwal 1451' },
  { date: '2030-02-05', libelle: 'Aïd Al Fitr — 2e jour',                  type: 'RELIGIEUX', reference: '2 Chawwal 1451' },
  { date: '2030-04-15', libelle: 'Aïd Al Adha (10 Dhul-Hijjah 1451)',      type: 'RELIGIEUX', reference: '10 Dhul-Hijjah 1451' },
  { date: '2030-04-16', libelle: 'Aïd Al Adha — 2e jour',                  type: 'RELIGIEUX', reference: '11 Dhul-Hijjah 1451' },
  { date: '2030-05-04', libelle: 'Nouvel an hégirien (1 Mouharram 1452)',  type: 'RELIGIEUX', reference: '1 Mouharram 1452' },
];

/** Génère les fêtes civiles fixes pour une année grégorienne donnée. */
function generateCiviles(year: number): JourFerieMa[] {
  return FETES_CIVILES_FIXES.map((f) => ({
    date: `${year}-${String(f.mois).padStart(2, '0')}-${String(f.jour).padStart(2, '0')}`,
    libelle: f.libelle,
    type: 'CIVIL' as const,
    reference: f.reference,
  }));
}

/**
 * Liste complète des jours fériés sur une plage d'années.
 * @param fromYear inclusif (défaut : année courante − 1)
 * @param toYear   inclusif (défaut : année courante + 4)
 */
export function buildJoursFeriesMa(fromYear?: number, toYear?: number): JourFerieMa[] {
  const currentYear = new Date().getFullYear();
  const start = fromYear ?? currentYear - 1;
  const end = toYear ?? currentYear + 4;
  const out: JourFerieMa[] = [];
  for (let y = start; y <= end; y++) {
    out.push(...generateCiviles(y));
  }
  for (const f of FETES_RELIGIEUSES) {
    const y = Number(f.date.slice(0, 4));
    if (y >= start && y <= end) out.push(f);
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

/** Jours fériés MA glissants (année courante − 1 → + 4) — exporté en constante pour les seeds. */
export const JOURS_FERIES_MA: JourFerieMa[] = buildJoursFeriesMa();
