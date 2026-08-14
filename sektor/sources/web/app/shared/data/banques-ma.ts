/**
 * Référentiel banques marocaines (M-MA-11, Round 2 P2).
 *
 * Sources :
 *  - Bank Al-Maghrib (codes 3 chiffres réservés à chaque banque).
 *  - Liste agréée AMMC + GIM-UEMOA (codes SWIFT/BIC).
 *
 * Le champ `codeBanque` correspond aux 3 premiers chiffres d'un RIB MA.
 *
 * Note : le champ `swift` est volontairement la racine 8 caractères ; les
 * agences MA utilisent souvent un suffixe pour le code BIC complet (11 car).
 */

export interface BanqueMa {
  /** Identifiant stable, en kebab-case. */
  id: string;
  /** Code banque (3 chiffres) — préfixe RIB MA. */
  codeBanque: string;
  /** Code SWIFT/BIC racine (8 caractères, agences ajoutent 3 chars). */
  swift: string;
  /** Raison sociale complète. */
  raisonSociale: string;
  /** Marque commerciale courte (sidebar / virements). */
  marque: string;
  /** Statut Open Banking — `true` si API REST publique exposée. */
  openBanking: boolean;
  /** Site officiel. */
  siteWeb?: string;
}

export const BANQUES_MA: readonly BanqueMa[] = [
  {
    id: 'awb',
    codeBanque: '007',
    swift: 'BCMAMAMC',
    raisonSociale: 'Attijariwafa Bank',
    marque: 'AWB',
    openBanking: true,
    siteWeb: 'https://www.attijariwafabank.com',
  },
  {
    id: 'bmce',
    codeBanque: '011',
    swift: 'BMCEMAMC',
    raisonSociale: 'BMCE Bank Of Africa',
    marque: 'BMCE BoA',
    openBanking: false,
    siteWeb: 'https://www.bankofafrica.ma',
  },
  {
    id: 'cih',
    codeBanque: '230',
    swift: 'CIHMMAMC',
    raisonSociale: 'CIH Bank',
    marque: 'CIH',
    openBanking: true,
    siteWeb: 'https://www.cihbank.ma',
  },
  {
    id: 'bp',
    codeBanque: '190',
    swift: 'BCPOMAMC',
    raisonSociale: 'Banque Populaire du Maroc',
    marque: 'BP',
    openBanking: false,
    siteWeb: 'https://www.banquepopulaire.ma',
  },
  {
    id: 'cdm',
    codeBanque: '021',
    swift: 'BMCIMAMC',
    raisonSociale: 'Crédit du Maroc',
    marque: 'CDM',
    openBanking: false,
    siteWeb: 'https://www.creditdumaroc.ma',
  },
  {
    id: 'bmci',
    codeBanque: '013',
    swift: 'BNPAMAMC',
    raisonSociale: 'BMCI — BNP Paribas',
    marque: 'BMCI',
    openBanking: false,
    siteWeb: 'https://www.bmci.ma',
  },
  {
    id: 'sgma',
    codeBanque: '022',
    swift: 'SGMBMAMC',
    raisonSociale: 'Société Générale Maroc',
    marque: 'SGM',
    openBanking: false,
    siteWeb: 'https://www.sgmaroc.com',
  },
  {
    id: 'cam',
    codeBanque: '225',
    swift: 'CNCAMAMC',
    raisonSociale: 'Crédit Agricole du Maroc',
    marque: 'CAM',
    openBanking: false,
    siteWeb: 'https://www.creditagricole.ma',
  },
  {
    id: 'cfg',
    codeBanque: '050',
    swift: 'CFGBMAMC',
    raisonSociale: 'CFG Bank',
    marque: 'CFG',
    openBanking: false,
    siteWeb: 'https://www.cfgbank.com',
  },
  {
    id: 'albarid',
    codeBanque: '350',
    swift: 'BCPMMAMC',
    raisonSociale: 'Al Barid Bank',
    marque: 'Al Barid',
    openBanking: false,
    siteWeb: 'https://www.albaridbank.ma',
  },
];

/** Recherche une banque par son code 3 chiffres (préfixe RIB). */
export function findBanqueByCode(codeBanque: string): BanqueMa | undefined {
  const code = codeBanque.padStart(3, '0').slice(0, 3);
  return BANQUES_MA.find((b) => b.codeBanque === code);
}

/** Recherche une banque par son id stable. */
export function findBanqueById(id: string): BanqueMa | undefined {
  return BANQUES_MA.find((b) => b.id === id);
}
