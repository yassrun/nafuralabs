/**
 * i18n keys for Contrat de Sous-Traitance status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/chantiers/sous-traitance/sous-traitance-listing/sous-traitance-listing.page.ts
 */

export type ContratSousTraitanceStatus =
  | 'BROUILLON'
  | 'SIGNE'
  | 'EN_COURS'
  | 'TERMINE'
  | 'RESILIE';

export const SOUS_TRAITANCE_STATUS_KEYS: Record<ContratSousTraitanceStatus, string> = {
  BROUILLON: 'enum.sous_traitance.status.brouillon',
  SIGNE:     'enum.sous_traitance.status.signe',
  EN_COURS:  'enum.sous_traitance.status.en_cours',
  TERMINE:   'enum.sous_traitance.status.termine',
  RESILIE:   'enum.sous_traitance.status.resilie',
};
