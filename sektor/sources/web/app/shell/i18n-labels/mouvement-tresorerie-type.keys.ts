/**
 * i18n keys for Mouvement de trésorerie type. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/finance/components/mouvement-row/mouvement-row.component.ts → TYPE_LABELS
 */

import type { MouvementTresorerieType } from '../../finance/models';

export const MOUVEMENT_TRESORERIE_TYPE_KEYS: Record<MouvementTresorerieType, string> = {
  REGLEMENT_CLIENT:  'enum.mouvement_tresorerie.type.reglement_client',
  REGLEMENT_FOURN:   'enum.mouvement_tresorerie.type.reglement_fourn',
  PAIEMENT_PAIE:     'enum.mouvement_tresorerie.type.paiement_paie',
  VIREMENT_INTERNE:  'enum.mouvement_tresorerie.type.virement_interne',
  FRAIS_BANCAIRES:   'enum.mouvement_tresorerie.type.frais_bancaires',
  COMMISSIONS:       'enum.mouvement_tresorerie.type.commissions',
  AUTRE_RECETTE:     'enum.mouvement_tresorerie.type.autre_recette',
  AUTRE_DEPENSE:     'enum.mouvement_tresorerie.type.autre_depense',
};
