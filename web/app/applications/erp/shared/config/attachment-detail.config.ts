/**
 * ERP entity type keys for platform attachment API (entityType + entityId).
 */
export const ERP_ATTACHMENT_ENTITY_TYPES = {
  CHANTIER: 'CHANTIER',
  SIT: 'SIT',
  AVANCEMENT: 'AVANCEMENT',
  BC: 'BC',
  DA: 'DA',
  AO: 'AO',
  DEVIS: 'DEVIS',
  FACTURE: 'FACTURE',
  FF: 'FF',
  INCIDENT: 'INCIDENT',
  CONGE: 'CONGE',
  RECEPTION: 'RECEPTION',
  OFFRE: 'OFFRE',
  BCC: 'BCC',
  AVOIR: 'AVOIR',
  CONTRAT_ACHAT: 'CONTRAT_ACHAT',
  MARCHE: 'MARCHE',
  AOC: 'AOC',
  POINTAGE_BATCH: 'POINTAGE_BATCH',
  CAISSE_MOUVEMENT: 'CAISSE_MOUVEMENT',
  PHOTO_CHANTIER: 'PHOTO_CHANTIER',
  DUER: 'DUER',
  PPSPS: 'PPSPS',
} as const;

export type ErpAttachmentEntityType =
  (typeof ERP_ATTACHMENT_ENTITY_TYPES)[keyof typeof ERP_ATTACHMENT_ENTITY_TYPES];

import type { AttachmentConfig, DetailPageFeatures } from '@lib/anatomy/types';
import type { DetailConfigOverrides } from '@lib/anatomy';

/** Enable the attachments tab on a config-driven entity detail page. */
export function withAttachments<T>(
  entityType: ErpAttachmentEntityType,
  attachmentConfig?: AttachmentConfig,
): Pick<DetailConfigOverrides<T>, 'features' | 'entityTypeForAttachments'> {
  const features: DetailPageFeatures = {
    attachments: true,
    ...(attachmentConfig ? { attachmentConfig } : {}),
  };
  return {
    features,
    entityTypeForAttachments: entityType,
  };
}

/** PDF + images preset for business documents. */
export const DOCUMENT_ATTACHMENT_CONFIG: AttachmentConfig = {
  maxFiles: 20,
  maxFileSize: 15 * 1024 * 1024,
  allowedTypes: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

/** Photo-only preset for field capture. */
export const PHOTO_ATTACHMENT_CONFIG: AttachmentConfig = {
  maxFiles: 10,
  maxFileSize: 8 * 1024 * 1024,
  allowedTypes: ['image/*'],
};
