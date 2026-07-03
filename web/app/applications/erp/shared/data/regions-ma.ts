/**
 * Référentiel administratif marocain — 12 régions (M-MA-12, P2).
 *
 * Source : Haut-Commissariat au Plan, découpage 2015 (loi organique
 * n° 111-14 sur les régions). Les codes officiels ANCFCC (Cadastre)
 * sont à 2 chiffres.
 *
 * Pour les besoins ERP BTP, on expose ici :
 *  - les **12 régions** + leurs chefs-lieux
 *  - quelques **provinces phares** (utiles pour adresse chantier)
 *
 * Le découpage complet (75 provinces / préfectures + ~1500 communes)
 * pourra être enrichi ultérieurement via import CSV HCP.
 */

export interface RegionMa {
  /** Code 2 chiffres ANCFCC. */
  code: string;
  /** Nom français officiel. */
  nom: string;
  /** Nom arabe (translittération latine). */
  nomAr?: string;
  /** Chef-lieu administratif. */
  chefLieu: string;
  /** Quelques provinces / préfectures phares (non exhaustif). */
  provinces: string[];
}

export const REGIONS_MA: readonly RegionMa[] = [
  {
    code: '01',
    nom: 'Tanger-Tétouan-Al Hoceïma',
    nomAr: 'Tanjah-Tétouan-Al Hoceïma',
    chefLieu: 'Tanger',
    provinces: ['Tanger-Assilah', 'M\'diq-Fnideq', 'Tétouan', 'Fahs-Anjra', 'Larache', 'Al Hoceïma', 'Chefchaouen', 'Ouezzane'],
  },
  {
    code: '02',
    nom: 'Oriental',
    nomAr: 'Ach-Charqia',
    chefLieu: 'Oujda',
    provinces: ['Oujda-Angad', 'Berkane', 'Driouch', 'Nador', 'Jerada', 'Taourirt', 'Guercif', 'Figuig'],
  },
  {
    code: '03',
    nom: 'Fès-Meknès',
    nomAr: 'Fas-Meknès',
    chefLieu: 'Fès',
    provinces: ['Fès', 'Meknès', 'Hajeb', 'Ifrane', 'Boulemane', 'Sefrou', 'Moulay Yacoub', 'Taounate', 'Taza'],
  },
  {
    code: '04',
    nom: 'Rabat-Salé-Kénitra',
    nomAr: 'Ar-Ribat-Sla-Kénitra',
    chefLieu: 'Rabat',
    provinces: ['Rabat', 'Salé', 'Skhirate-Témara', 'Kénitra', 'Khémisset', 'Sidi Slimane', 'Sidi Kacem'],
  },
  {
    code: '05',
    nom: 'Béni Mellal-Khénifra',
    nomAr: 'Beni Mellal-Khénifra',
    chefLieu: 'Béni Mellal',
    provinces: ['Béni Mellal', 'Azilal', 'Fquih Ben Salah', 'Khénifra', 'Khouribga'],
  },
  {
    code: '06',
    nom: 'Casablanca-Settat',
    nomAr: 'Ad-Dar Al Bayda-Settat',
    chefLieu: 'Casablanca',
    provinces: ['Casablanca', 'Mohammadia', 'Médiouna', 'Nouaceur', 'Settat', 'Berrechid', 'Benslimane', 'El Jadida', 'Sidi Bennour'],
  },
  {
    code: '07',
    nom: 'Marrakech-Safi',
    nomAr: 'Marrakech-Safi',
    chefLieu: 'Marrakech',
    provinces: ['Marrakech', 'Chichaoua', 'Al Haouz', 'El Kelaâ des Sraghna', 'Essaouira', 'Rehamna', 'Safi', 'Youssoufia'],
  },
  {
    code: '08',
    nom: 'Drâa-Tafilalet',
    nomAr: 'Daraa-Tafilalt',
    chefLieu: 'Errachidia',
    provinces: ['Errachidia', 'Ouarzazate', 'Midelt', 'Tinghir', 'Zagora'],
  },
  {
    code: '09',
    nom: 'Souss-Massa',
    nomAr: 'Souss-Massa',
    chefLieu: 'Agadir',
    provinces: ['Agadir-Ida Outanane', 'Inezgane-Aït Melloul', 'Chtouka-Aït Baha', 'Taroudant', 'Tiznit', 'Tata'],
  },
  {
    code: '10',
    nom: 'Guelmim-Oued Noun',
    nomAr: 'Guelmim-Oued Noun',
    chefLieu: 'Guelmim',
    provinces: ['Guelmim', 'Assa-Zag', 'Tan-Tan', 'Sidi Ifni'],
  },
  {
    code: '11',
    nom: 'Laâyoune-Sakia El Hamra',
    nomAr: 'Al Aaiun-Saqiya Al Hamra',
    chefLieu: 'Laâyoune',
    provinces: ['Laâyoune', 'Boujdour', 'Tarfaya', 'Es-Semara'],
  },
  {
    code: '12',
    nom: 'Dakhla-Oued Ed-Dahab',
    nomAr: 'Ad-Dakhla-Oued Ed-Dahab',
    chefLieu: 'Dakhla',
    provinces: ['Oued Ed-Dahab', 'Aousserd'],
  },
];

export function findRegionByCode(code: string): RegionMa | undefined {
  return REGIONS_MA.find((r) => r.code === code.padStart(2, '0'));
}

export function findRegionByName(name: string): RegionMa | undefined {
  const target = name.trim().toLowerCase();
  return REGIONS_MA.find((r) => r.nom.toLowerCase() === target);
}
