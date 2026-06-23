/**
 * Multi-tenancy models — Sociétés & Établissements (Task 8.3).
 *
 * Notes :
 * - `Societe` modélise la personne morale (entité légale Maroc) : ICE, IF, RC, etc.
 * - `Etablissement` modélise les implantations physiques rattachées (siège, agence, base chantier).
 * - Volontairement plus minimal que la spec long-terme (RibBancaire/Exercice ne sont pas
 *   redéfinis ici car ils existent déjà côté `societe.page.ts` legacy form). Les RIBs / exercices
 *   pourront être déplacés ici dans une étape ultérieure.
 */

export type SocieteFormeJuridique = 'SARL' | 'SA' | 'SARLAU' | 'SAS';

export type EtablissementType = 'SIEGE' | 'FILIALE' | 'AGENCE' | 'CHANTIER_BASE';

export interface Societe {
  id: string;
  raisonSociale: string;
  formeJuridique: SocieteFormeJuridique;
  ice: string;
  if: string;
  rc: string;
  patente: string;
  cnss: string;
  tvaIntra?: string;
  siegeAdresse: string;
  isActive: boolean;
}

export interface Etablissement {
  id: string;
  societeId: string;
  nom: string;
  type: EtablissementType;
  ville: string;
  adresse: string;
  isActive: boolean;
}

// @i18n-exempt — @deprecated Phase 1.2 — see ETABLISSEMENT_TYPE_KEYS in @applications/erp/shell/i18n-labels.
export const ETABLISSEMENT_TYPE_LABELS: Record<EtablissementType, string> = {
  SIEGE: 'Siège',
  FILIALE: 'Filiale',
  AGENCE: 'Agence',
  CHANTIER_BASE: 'Base chantier',
};

// @i18n-exempt — @deprecated Phase 1.2 — see FORME_JURIDIQUE_KEYS in @applications/erp/shell/i18n-labels.
export const FORME_JURIDIQUE_LABELS: Record<SocieteFormeJuridique, string> = {
  SARL: 'SARL',
  SA: 'SA',
  SARLAU: 'SARL à Associé Unique',
  SAS: 'SAS',
};
