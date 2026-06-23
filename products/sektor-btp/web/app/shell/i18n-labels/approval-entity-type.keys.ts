/**
 * i18n keys for Approval entity types. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/approbations/models/index.ts → ENTITY_TYPE_LABELS
 */

import type { ApprovalEntityType } from '../../pages/approbations/models';

export const APPROVAL_ENTITY_TYPE_KEYS: Record<ApprovalEntityType, string> = {
  DA:             'enum.approval_entity_type.da',
  AO:             'enum.approval_entity_type.ao',
  BC:             'enum.approval_entity_type.bc',
  FF:             'enum.approval_entity_type.ff',
  SIT:            'enum.approval_entity_type.sit',
  CONGE:          'enum.approval_entity_type.conge',
  PAIE:           'enum.approval_entity_type.paie',
  VIR:            'enum.approval_entity_type.vir',
  AVN:            'enum.approval_entity_type.avn',
  OS:             'enum.approval_entity_type.os',
  FACTURE_CLIENT: 'enum.approval_entity_type.facture_client',
  NOTE_FRAIS:     'enum.approval_entity_type.note_frais',
  CONTRAT_ST:     'enum.approval_entity_type.contrat_st',
};
