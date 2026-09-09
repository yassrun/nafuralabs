import type { ActiviteForme } from '../../services/activite-api.service';

export interface PlanningNatureOption {
  code: string;
  forme: 'ACTIVITE' | 'JALON';
  labelKey: string;
}

/** Catalogue L1 aligné sur le seed `chantier_activite_natures` (SEKTOR-325). */
export const PLANNING_NATURES: readonly PlanningNatureOption[] = [
  { code: 'PREPA_INSTALL', forme: 'ACTIVITE', labelKey: 'chantiers.planning.natures.prepaInstall' },
  { code: 'ETUDES_VALIDATION', forme: 'ACTIVITE', labelKey: 'chantiers.planning.natures.etudesValidation' },
  { code: 'APPROVISIONNEMENT', forme: 'ACTIVITE', labelKey: 'chantiers.planning.natures.approvisionnement' },
  { code: 'TRAVAUX', forme: 'ACTIVITE', labelKey: 'chantiers.planning.natures.travaux' },
  { code: 'CONTROLE_ESSAI', forme: 'ACTIVITE', labelKey: 'chantiers.planning.natures.controleEssai' },
  { code: 'RECEPTION_CLOTURE', forme: 'ACTIVITE', labelKey: 'chantiers.planning.natures.receptionCloture' },
  { code: 'JALON_TECHNIQUE', forme: 'JALON', labelKey: 'chantiers.planning.natures.jalonTechnique' },
  { code: 'JALON_CONTRACTUEL', forme: 'JALON', labelKey: 'chantiers.planning.natures.jalonContractuel' },
  { code: 'JALON_FINANCIER', forme: 'JALON', labelKey: 'chantiers.planning.natures.jalonFinancier' },
];

export function naturesForForme(forme: ActiviteForme): PlanningNatureOption[] {
  if (forme === 'JALON') {
    return PLANNING_NATURES.filter((n) => n.forme === 'JALON');
  }
  return PLANNING_NATURES.filter((n) => n.forme === 'ACTIVITE');
}
