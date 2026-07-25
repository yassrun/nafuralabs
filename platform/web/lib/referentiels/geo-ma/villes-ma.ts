/**
 * Référentiel des villes marocaines — chefs-lieux de province / préfecture
 * et principales communes urbaines (~115 villes).
 *
 * Le **nom canonique** (`nom`) est la clé métier stockée dans les colonnes
 * `ville` existantes (chantiers, clients, employés…) : aucun code n'est
 * persisté, la région / province se dérivent du référentiel à la lecture.
 *
 * `code` est un slug stable en kebab-case, utile pour le reporting et les
 * échanges (exports, API futures).
 */

export interface VilleMa {
  /** Slug stable, kebab-case. */
  code: string;
  /** Nom canonique français (clé stockée en base). */
  nom: string;
  /** Code de la région (cf. REGIONS_MA). */
  regionCode: string;
  /** Slug de la province / préfecture (cf. PROVINCES_MA). */
  provinceCode: string;
  /** Chef-lieu de région. */
  chefLieuRegion?: boolean;
  /** Chef-lieu de province / préfecture. */
  chefLieuProvince?: boolean;
  /** Code postal principal (indicatif). */
  codePostal?: string;
}

export const VILLES_MA: readonly VilleMa[] = [
  // ── 01 Tanger-Tétouan-Al Hoceïma ──────────────────────────────────────
  { code: 'tanger', nom: 'Tanger', regionCode: '01', provinceCode: 'tanger-assilah', chefLieuRegion: true, chefLieuProvince: true, codePostal: '90000' },
  { code: 'assilah', nom: 'Assilah', regionCode: '01', provinceCode: 'tanger-assilah' },
  { code: 'mdiq', nom: "M'diq", regionCode: '01', provinceCode: 'mdiq-fnideq', chefLieuProvince: true },
  { code: 'fnideq', nom: 'Fnideq', regionCode: '01', provinceCode: 'mdiq-fnideq' },
  { code: 'martil', nom: 'Martil', regionCode: '01', provinceCode: 'mdiq-fnideq' },
  { code: 'tetouan', nom: 'Tétouan', regionCode: '01', provinceCode: 'tetouan', chefLieuProvince: true, codePostal: '93000' },
  { code: 'larache', nom: 'Larache', regionCode: '01', provinceCode: 'larache', chefLieuProvince: true },
  { code: 'ksar-el-kebir', nom: 'Ksar El Kébir', regionCode: '01', provinceCode: 'larache' },
  { code: 'al-hoceima', nom: 'Al Hoceïma', regionCode: '01', provinceCode: 'al-hoceima', chefLieuProvince: true },
  { code: 'imzouren', nom: 'Imzouren', regionCode: '01', provinceCode: 'al-hoceima' },
  { code: 'targuist', nom: 'Targuist', regionCode: '01', provinceCode: 'al-hoceima' },
  { code: 'chefchaouen', nom: 'Chefchaouen', regionCode: '01', provinceCode: 'chefchaouen', chefLieuProvince: true },
  { code: 'ouezzane', nom: 'Ouezzane', regionCode: '01', provinceCode: 'ouezzane', chefLieuProvince: true },

  // ── 02 Oriental ───────────────────────────────────────────────────────
  { code: 'oujda', nom: 'Oujda', regionCode: '02', provinceCode: 'oujda-angad', chefLieuRegion: true, chefLieuProvince: true, codePostal: '60000' },
  { code: 'nador', nom: 'Nador', regionCode: '02', provinceCode: 'nador', chefLieuProvince: true, codePostal: '62000' },
  { code: 'zaio', nom: 'Zaïo', regionCode: '02', provinceCode: 'nador' },
  { code: 'zeghanghane', nom: 'Zeghanghane', regionCode: '02', provinceCode: 'nador' },
  { code: 'driouch', nom: 'Driouch', regionCode: '02', provinceCode: 'driouch', chefLieuProvince: true },
  { code: 'midar', nom: 'Midar', regionCode: '02', provinceCode: 'driouch' },
  { code: 'jerada', nom: 'Jerada', regionCode: '02', provinceCode: 'jerada', chefLieuProvince: true },
  { code: 'berkane', nom: 'Berkane', regionCode: '02', provinceCode: 'berkane', chefLieuProvince: true },
  { code: 'ahfir', nom: 'Ahfir', regionCode: '02', provinceCode: 'berkane' },
  { code: 'saidia', nom: 'Saïdia', regionCode: '02', provinceCode: 'berkane' },
  { code: 'taourirt', nom: 'Taourirt', regionCode: '02', provinceCode: 'taourirt', chefLieuProvince: true },
  { code: 'el-aioun-sidi-mellouk', nom: 'El Aïoun Sidi Mellouk', regionCode: '02', provinceCode: 'taourirt' },
  { code: 'guercif', nom: 'Guercif', regionCode: '02', provinceCode: 'guercif', chefLieuProvince: true },
  { code: 'figuig', nom: 'Figuig', regionCode: '02', provinceCode: 'figuig' },
  { code: 'bouarfa', nom: 'Bouarfa', regionCode: '02', provinceCode: 'figuig', chefLieuProvince: true },

  // ── 03 Fès-Meknès ─────────────────────────────────────────────────────
  { code: 'fes', nom: 'Fès', regionCode: '03', provinceCode: 'fes', chefLieuRegion: true, chefLieuProvince: true, codePostal: '30000' },
  { code: 'meknes', nom: 'Meknès', regionCode: '03', provinceCode: 'meknes', chefLieuProvince: true, codePostal: '50000' },
  { code: 'el-hajeb', nom: 'El Hajeb', regionCode: '03', provinceCode: 'el-hajeb', chefLieuProvince: true },
  { code: 'ifrane', nom: 'Ifrane', regionCode: '03', provinceCode: 'ifrane', chefLieuProvince: true },
  { code: 'azrou', nom: 'Azrou', regionCode: '03', provinceCode: 'ifrane' },
  { code: 'moulay-yacoub', nom: 'Moulay Yacoub', regionCode: '03', provinceCode: 'moulay-yacoub', chefLieuProvince: true },
  { code: 'sefrou', nom: 'Sefrou', regionCode: '03', provinceCode: 'sefrou', chefLieuProvince: true },
  { code: 'boulemane', nom: 'Boulemane', regionCode: '03', provinceCode: 'boulemane', chefLieuProvince: true },
  { code: 'missour', nom: 'Missour', regionCode: '03', provinceCode: 'boulemane' },
  { code: 'taounate', nom: 'Taounate', regionCode: '03', provinceCode: 'taounate', chefLieuProvince: true },
  { code: 'taza', nom: 'Taza', regionCode: '03', provinceCode: 'taza', chefLieuProvince: true },

  // ── 04 Rabat-Salé-Kénitra ─────────────────────────────────────────────
  { code: 'rabat', nom: 'Rabat', regionCode: '04', provinceCode: 'rabat', chefLieuRegion: true, chefLieuProvince: true, codePostal: '10000' },
  { code: 'sale', nom: 'Salé', regionCode: '04', provinceCode: 'sale', chefLieuProvince: true, codePostal: '11000' },
  { code: 'temara', nom: 'Témara', regionCode: '04', provinceCode: 'skhirate-temara', chefLieuProvince: true, codePostal: '12000' },
  { code: 'skhirate', nom: 'Skhirate', regionCode: '04', provinceCode: 'skhirate-temara' },
  { code: 'kenitra', nom: 'Kénitra', regionCode: '04', provinceCode: 'kenitra', chefLieuProvince: true, codePostal: '14000' },
  { code: 'khemisset', nom: 'Khémisset', regionCode: '04', provinceCode: 'khemisset', chefLieuProvince: true },
  { code: 'tiflet', nom: 'Tiflet', regionCode: '04', provinceCode: 'khemisset' },
  { code: 'sidi-kacem', nom: 'Sidi Kacem', regionCode: '04', provinceCode: 'sidi-kacem', chefLieuProvince: true },
  { code: 'souk-el-arbaa', nom: 'Souk El Arbaa', regionCode: '04', provinceCode: 'sidi-kacem' },
  { code: 'sidi-slimane', nom: 'Sidi Slimane', regionCode: '04', provinceCode: 'sidi-slimane', chefLieuProvince: true },

  // ── 05 Béni Mellal-Khénifra ───────────────────────────────────────────
  { code: 'beni-mellal', nom: 'Béni Mellal', regionCode: '05', provinceCode: 'beni-mellal', chefLieuRegion: true, chefLieuProvince: true, codePostal: '23000' },
  { code: 'kasba-tadla', nom: 'Kasba Tadla', regionCode: '05', provinceCode: 'beni-mellal' },
  { code: 'azilal', nom: 'Azilal', regionCode: '05', provinceCode: 'azilal', chefLieuProvince: true },
  { code: 'demnate', nom: 'Demnate', regionCode: '05', provinceCode: 'azilal' },
  { code: 'fquih-ben-salah', nom: 'Fquih Ben Salah', regionCode: '05', provinceCode: 'fquih-ben-salah', chefLieuProvince: true },
  { code: 'khenifra', nom: 'Khénifra', regionCode: '05', provinceCode: 'khenifra', chefLieuProvince: true },
  { code: 'mrirt', nom: "M'rirt", regionCode: '05', provinceCode: 'khenifra' },
  { code: 'khouribga', nom: 'Khouribga', regionCode: '05', provinceCode: 'khouribga', chefLieuProvince: true },
  { code: 'oued-zem', nom: 'Oued Zem', regionCode: '05', provinceCode: 'khouribga' },
  { code: 'bejaad', nom: 'Bejaad', regionCode: '05', provinceCode: 'khouribga' },

  // ── 06 Casablanca-Settat ──────────────────────────────────────────────
  { code: 'casablanca', nom: 'Casablanca', regionCode: '06', provinceCode: 'casablanca', chefLieuRegion: true, chefLieuProvince: true, codePostal: '20000' },
  { code: 'mohammedia', nom: 'Mohammédia', regionCode: '06', provinceCode: 'mohammedia', chefLieuProvince: true, codePostal: '28800' },
  { code: 'el-jadida', nom: 'El Jadida', regionCode: '06', provinceCode: 'el-jadida', chefLieuProvince: true, codePostal: '24000' },
  { code: 'azemmour', nom: 'Azemmour', regionCode: '06', provinceCode: 'el-jadida' },
  { code: 'bouskoura', nom: 'Bouskoura', regionCode: '06', provinceCode: 'nouaceur', chefLieuProvince: true },
  { code: 'dar-bouazza', nom: 'Dar Bouazza', regionCode: '06', provinceCode: 'nouaceur' },
  { code: 'mediouna', nom: 'Médiouna', regionCode: '06', provinceCode: 'mediouna', chefLieuProvince: true },
  { code: 'tit-mellil', nom: 'Tit Mellil', regionCode: '06', provinceCode: 'mediouna' },
  { code: 'benslimane', nom: 'Benslimane', regionCode: '06', provinceCode: 'benslimane', chefLieuProvince: true },
  { code: 'bouznika', nom: 'Bouznika', regionCode: '06', provinceCode: 'benslimane' },
  { code: 'berrechid', nom: 'Berrechid', regionCode: '06', provinceCode: 'berrechid', chefLieuProvince: true },
  { code: 'settat', nom: 'Settat', regionCode: '06', provinceCode: 'settat', chefLieuProvince: true, codePostal: '26000' },
  { code: 'sidi-bennour', nom: 'Sidi Bennour', regionCode: '06', provinceCode: 'sidi-bennour', chefLieuProvince: true },
  { code: 'zemamra', nom: 'Zemamra', regionCode: '06', provinceCode: 'sidi-bennour' },

  // ── 07 Marrakech-Safi ─────────────────────────────────────────────────
  { code: 'marrakech', nom: 'Marrakech', regionCode: '07', provinceCode: 'marrakech', chefLieuRegion: true, chefLieuProvince: true, codePostal: '40000' },
  { code: 'chichaoua', nom: 'Chichaoua', regionCode: '07', provinceCode: 'chichaoua', chefLieuProvince: true },
  { code: 'imintanoute', nom: 'Imintanoute', regionCode: '07', provinceCode: 'chichaoua' },
  { code: 'tahannaout', nom: 'Tahannaout', regionCode: '07', provinceCode: 'al-haouz', chefLieuProvince: true },
  { code: 'ait-ourir', nom: 'Aït Ourir', regionCode: '07', provinceCode: 'al-haouz' },
  { code: 'amizmiz', nom: 'Amizmiz', regionCode: '07', provinceCode: 'al-haouz' },
  { code: 'el-kelaa-des-sraghna', nom: 'El Kelâa des Sraghna', regionCode: '07', provinceCode: 'el-kelaa-des-sraghna', chefLieuProvince: true },
  { code: 'essaouira', nom: 'Essaouira', regionCode: '07', provinceCode: 'essaouira', chefLieuProvince: true, codePostal: '44000' },
  { code: 'ben-guerir', nom: 'Ben Guerir', regionCode: '07', provinceCode: 'rehamna', chefLieuProvince: true },
  { code: 'safi', nom: 'Safi', regionCode: '07', provinceCode: 'safi', chefLieuProvince: true, codePostal: '46000' },
  { code: 'youssoufia', nom: 'Youssoufia', regionCode: '07', provinceCode: 'youssoufia', chefLieuProvince: true },

  // ── 08 Drâa-Tafilalet ─────────────────────────────────────────────────
  { code: 'errachidia', nom: 'Errachidia', regionCode: '08', provinceCode: 'errachidia', chefLieuRegion: true, chefLieuProvince: true, codePostal: '52000' },
  { code: 'erfoud', nom: 'Erfoud', regionCode: '08', provinceCode: 'errachidia' },
  { code: 'rissani', nom: 'Rissani', regionCode: '08', provinceCode: 'errachidia' },
  { code: 'goulmima', nom: 'Goulmima', regionCode: '08', provinceCode: 'errachidia' },
  { code: 'rich', nom: 'Rich', regionCode: '08', provinceCode: 'errachidia' },
  { code: 'ouarzazate', nom: 'Ouarzazate', regionCode: '08', provinceCode: 'ouarzazate', chefLieuProvince: true, codePostal: '45000' },
  { code: 'midelt', nom: 'Midelt', regionCode: '08', provinceCode: 'midelt', chefLieuProvince: true },
  { code: 'tinghir', nom: 'Tinghir', regionCode: '08', provinceCode: 'tinghir', chefLieuProvince: true },
  { code: 'boumalne-dades', nom: 'Boumalne Dadès', regionCode: '08', provinceCode: 'tinghir' },
  { code: 'zagora', nom: 'Zagora', regionCode: '08', provinceCode: 'zagora', chefLieuProvince: true },

  // ── 09 Souss-Massa ────────────────────────────────────────────────────
  { code: 'agadir', nom: 'Agadir', regionCode: '09', provinceCode: 'agadir-ida-outanane', chefLieuRegion: true, chefLieuProvince: true, codePostal: '80000' },
  { code: 'inezgane', nom: 'Inezgane', regionCode: '09', provinceCode: 'inezgane-ait-melloul', chefLieuProvince: true },
  { code: 'ait-melloul', nom: 'Aït Melloul', regionCode: '09', provinceCode: 'inezgane-ait-melloul' },
  { code: 'dcheira-el-jihadia', nom: 'Dcheira El Jihadia', regionCode: '09', provinceCode: 'inezgane-ait-melloul' },
  { code: 'biougra', nom: 'Biougra', regionCode: '09', provinceCode: 'chtouka-ait-baha', chefLieuProvince: true },
  { code: 'taroudant', nom: 'Taroudant', regionCode: '09', provinceCode: 'taroudant', chefLieuProvince: true },
  { code: 'oulad-teima', nom: 'Oulad Teima', regionCode: '09', provinceCode: 'taroudant' },
  { code: 'tiznit', nom: 'Tiznit', regionCode: '09', provinceCode: 'tiznit', chefLieuProvince: true },
  { code: 'tata', nom: 'Tata', regionCode: '09', provinceCode: 'tata', chefLieuProvince: true },

  // ── 10 Guelmim-Oued Noun ──────────────────────────────────────────────
  { code: 'guelmim', nom: 'Guelmim', regionCode: '10', provinceCode: 'guelmim', chefLieuRegion: true, chefLieuProvince: true, codePostal: '81000' },
  { code: 'bouizakarne', nom: 'Bouizakarne', regionCode: '10', provinceCode: 'guelmim' },
  { code: 'assa', nom: 'Assa', regionCode: '10', provinceCode: 'assa-zag', chefLieuProvince: true },
  { code: 'tan-tan', nom: 'Tan-Tan', regionCode: '10', provinceCode: 'tan-tan', chefLieuProvince: true },
  { code: 'el-ouatia', nom: 'El Ouatia', regionCode: '10', provinceCode: 'tan-tan' },
  { code: 'sidi-ifni', nom: 'Sidi Ifni', regionCode: '10', provinceCode: 'sidi-ifni', chefLieuProvince: true },

  // ── 11 Laâyoune-Sakia El Hamra ────────────────────────────────────────
  { code: 'laayoune', nom: 'Laâyoune', regionCode: '11', provinceCode: 'laayoune', chefLieuRegion: true, chefLieuProvince: true, codePostal: '70000' },
  { code: 'el-marsa', nom: 'El Marsa', regionCode: '11', provinceCode: 'laayoune' },
  { code: 'boujdour', nom: 'Boujdour', regionCode: '11', provinceCode: 'boujdour', chefLieuProvince: true },
  { code: 'tarfaya', nom: 'Tarfaya', regionCode: '11', provinceCode: 'tarfaya', chefLieuProvince: true },
  { code: 'es-semara', nom: 'Es-Semara', regionCode: '11', provinceCode: 'es-semara', chefLieuProvince: true },

  // ── 12 Dakhla-Oued Ed-Dahab ───────────────────────────────────────────
  { code: 'dakhla', nom: 'Dakhla', regionCode: '12', provinceCode: 'oued-ed-dahab', chefLieuRegion: true, chefLieuProvince: true, codePostal: '73000' },
  { code: 'aousserd', nom: 'Aousserd', regionCode: '12', provinceCode: 'aousserd', chefLieuProvince: true },
];
