/**
 * i18n keys for Numbering Policy document type. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/shell/numbering-policy.service.ts → NUMBERING_DOC_TYPE_LABELS
 */

import type { NumberingDocType } from '../numbering-policy.service';

export const NUMBERING_DOC_TYPE_KEYS: Record<NumberingDocType, string> = {
  DEVIS:                  'enum.numbering_doc_type.devis',
  BON_COMMANDE_ACHAT:     'enum.numbering_doc_type.bon_commande_achat',
  FACTURE_VENTE:          'enum.numbering_doc_type.facture_vente',
  BON_LIVRAISON:          'enum.numbering_doc_type.bon_livraison',
  SITUATION_TRAVAUX:      'enum.numbering_doc_type.situation_travaux',
  ATTACHEMENT:            'enum.numbering_doc_type.attachement',
  CONTRAT_SOUS_TRAITANCE: 'enum.numbering_doc_type.contrat_sous_traitance',
};
