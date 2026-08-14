/**
 * i18n keys for Bons Commande Client status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/ventes/bons-commandes-clients/config/listing/columns.ts → BCC_STATUS_LABELS
 */

export type BccStatus =
  | 'RECU'
  | 'EN_COURS'
  | 'PARTIELLEMENT_FACTURE'
  | 'FACTURE'
  | 'CLOTURE'
  | 'ANNULE';

export const BCC_STATUS_KEYS: Record<BccStatus, string> = {
  RECU:                  'enum.bcc.status.recu',
  EN_COURS:              'enum.bcc.status.en_cours',
  PARTIELLEMENT_FACTURE: 'enum.bcc.status.partiellement_facture',
  FACTURE:               'enum.bcc.status.facture',
  CLOTURE:               'enum.bcc.status.cloture',
  ANNULE:                'enum.bcc.status.annule',
};
