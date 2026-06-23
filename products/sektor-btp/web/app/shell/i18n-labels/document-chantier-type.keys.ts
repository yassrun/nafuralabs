/**
 * i18n keys for Document chantier type. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/chantiers/documents/models/index.ts → DOCUMENT_TYPE_LABELS
 */

import type { DocumentChantierType } from '../../pages/chantiers/documents/models';

export const DOCUMENT_CHANTIER_TYPE_KEYS: Record<DocumentChantierType, string> = {
  MARCHE:               'enum.document_chantier.type.marche',
  AVENANT:              'enum.document_chantier.type.avenant',
  PV_RECEPTION:         'enum.document_chantier.type.pv_reception',
  PLAN:                 'enum.document_chantier.type.plan',
  PHOTO:                'enum.document_chantier.type.photo',
  BC:                   'enum.document_chantier.type.bc',
  FACTURE:              'enum.document_chantier.type.facture',
  ATTESTATION_ASSURANCE:'enum.document_chantier.type.attestation_assurance',
  CAUTION_BANCAIRE:     'enum.document_chantier.type.caution_bancaire',
  PPSPS:                'enum.document_chantier.type.ppsps',
  PLAN_PREVENTION:      'enum.document_chantier.type.plan_prevention',
  NOTE_CALCUL:          'enum.document_chantier.type.note_calcul',
  AUTRE:                'enum.document_chantier.type.autre',
};
