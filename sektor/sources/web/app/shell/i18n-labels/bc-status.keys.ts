/**
 * i18n keys for Bon de Commande (achats) status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/achats/commandes/config/listing/columns.ts → BC_STATUS_LABELS
 */

export type BcStatus =
  | 'BROUILLON'
  | 'VALIDE'
  | 'ENVOYE'
  | 'ACCUSE_RECEPTION'
  | 'PARTIELLEMENT_LIVRE'
  | 'LIVRE'
  | 'FACTURE'
  | 'CLOTURE'
  | 'ANNULE';

export const BC_STATUS_KEYS: Record<BcStatus, string> = {
  BROUILLON:           'enum.bc.status.brouillon',
  VALIDE:              'enum.bc.status.valide',
  ENVOYE:              'enum.bc.status.envoye',
  ACCUSE_RECEPTION:    'enum.bc.status.accuse_reception',
  PARTIELLEMENT_LIVRE: 'enum.bc.status.partiellement_livre',
  LIVRE:               'enum.bc.status.livre',
  FACTURE:             'enum.bc.status.facture',
  CLOTURE:             'enum.bc.status.cloture',
  ANNULE:              'enum.bc.status.annule',
};
