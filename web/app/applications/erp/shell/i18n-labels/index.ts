/**
 * Barrel export — centralised i18n keys for every `*_LABELS` map that used to
 * be scattered across the ERP code base (~25+ declarations).
 *
 * Phase 1.2 of the i18n roadmap (cf. `web/docs/specs/i18n-roadmap/00-PROGRESS.md`).
 *
 * Usage:
 *
 *   ```ts
 *   import { FACTURE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
 *   // Template: {{ FACTURE_STATUS_KEYS[status] | translate }}
 *   // TS:      translateService.instant(FACTURE_STATUS_KEYS[status])
 *   ```
 *
 * All values are translation keys of the form `enum.<entity>.<field>.<value>`
 * and resolve via the `core` translation pack (`web/public/assets/i18n/core/{fr,en}.json`).
 */

export * from './facture-status.keys';
export * from './marche-status.keys';
export * from './marche-type.keys';
export * from './marche-nature.keys';
export * from './avenant.keys';
export * from './caution.keys';
export * from './dgd-status.keys';
export * from './ordre-service.keys';
export * from './facture-marche-status.keys';
export * from './ao-status.keys';
export * from './bcc-status.keys';
export * from './offre-status.keys';
export * from './da-status.keys';
export * from './ct-status.keys';
export * from './bc-status.keys';
export * from './numbering-doc-type.keys';
export * from './failure-reason.keys';
export * from './outcome.keys';
export * from './mode-labels.keys';
export * from './gravite.keys';
export * from './aptitude.keys';
export * from './perimetre.keys';
export * from './etablissement-type.keys';
export * from './phase-status.keys';
export * from './forme-juridique.keys';
export * from './source.keys';
export * from './day.keys';
export * from './amount-source.keys';
export * from './chantier.keys';
export * from './attachement-status.keys';
export * from './sous-traitance-status.keys';
export * from './ff-status.keys';
export * from './ecriture.keys';
export * from './hse.keys';
export * from './journal-event-type.keys';
export * from './condition-paiement-type.keys';
export * from './journal-type.keys';
export * from './mouvement-tresorerie-type.keys';
export * from './etudes.keys';
export * from './moa-type.keys';
export * from './document-chantier-type.keys';
export * from './approval-entity-type.keys';
export * from './avoir-status.keys';
export * from './situation-status.keys';

import { FACTURE_STATUS_KEYS, FACTURE_TYPE_KEYS } from './facture-status.keys';
import { MARCHE_STATUS_KEYS } from './marche-status.keys';
import { MARCHE_TYPE_KEYS } from './marche-type.keys';
import { MARCHE_NATURE_KEYS } from './marche-nature.keys';
import { AVENANT_STATUS_KEYS, AVENANT_TYPE_KEYS } from './avenant.keys';
import { CAUTION_STATUS_KEYS, CAUTION_TYPE_KEYS } from './caution.keys';
import { DGD_STATUS_KEYS } from './dgd-status.keys';
import { ORDRE_SERVICE_STATUS_KEYS, ORDRE_SERVICE_TYPE_KEYS } from './ordre-service.keys';
import { FACTURE_MARCHE_STATUS_KEYS } from './facture-marche-status.keys';
import { AO_STATUS_KEYS } from './ao-status.keys';
import { BCC_STATUS_KEYS } from './bcc-status.keys';
import { OFFRE_STATUS_KEYS } from './offre-status.keys';
import { DA_STATUS_KEYS } from './da-status.keys';
import { CT_STATUS_KEYS } from './ct-status.keys';
import { BC_STATUS_KEYS } from './bc-status.keys';
import { NUMBERING_DOC_TYPE_KEYS } from './numbering-doc-type.keys';
import { FAILURE_REASON_KEYS } from './failure-reason.keys';
import { OUTCOME_KEYS } from './outcome.keys';
import { MODE_KEYS } from './mode-labels.keys';
import { GRAVITE_KEYS } from './gravite.keys';
import { APTITUDE_KEYS, TYPE_VISITE_KEYS } from './aptitude.keys';
import { PERIMETRE_KEYS } from './perimetre.keys';
import { ETABLISSEMENT_TYPE_KEYS } from './etablissement-type.keys';
import { PHASE_STATUS_KEYS } from './phase-status.keys';
import { FORME_JURIDIQUE_KEYS } from './forme-juridique.keys';
import { SOURCE_KEYS } from './source.keys';
import { DAY_KEYS } from './day.keys';
import { AMOUNT_SOURCE_KEYS } from './amount-source.keys';
import { CHANTIER_STATUS_KEYS, CHANTIER_TYPE_KEYS } from './chantier.keys';
import { ATTACHEMENT_STATUS_KEYS } from './attachement-status.keys';
import { SOUS_TRAITANCE_STATUS_KEYS } from './sous-traitance-status.keys';
import { FF_STATUS_KEYS } from './ff-status.keys';
import { ECRITURE_STATUS_KEYS, ECRITURE_ORIGINE_KEYS } from './ecriture.keys';
import {
  DUER_STATUS_KEYS,
  PPSPS_STATUS_KEYS,
  INCIDENT_STATUS_KEYS,
  INCIDENT_TYPE_KEYS,
  INSPECTION_STATUS_KEYS,
  FORMATION_STATUS_KEYS,
  NC_STATUS_KEYS,
  NC_TYPE_KEYS,
  EPI_STATUS_KEYS,
  EPI_CATEGORIE_KEYS,
} from './hse.keys';
import { JOURNAL_EVENT_TYPE_KEYS } from './journal-event-type.keys';
import { CONDITION_PAIEMENT_TYPE_KEYS } from './condition-paiement-type.keys';
import { JOURNAL_TYPE_KEYS } from './journal-type.keys';
import { MOUVEMENT_TRESORERIE_TYPE_KEYS } from './mouvement-tresorerie-type.keys';
import {
  DEVIS_STATUS_KEYS,
  METRE_STATUS_KEYS,
  AO_CLIENT_STATUS_KEYS,
  AO_CLIENT_TYPE_KEYS,
} from './etudes.keys';
import { MOA_TYPE_KEYS } from './moa-type.keys';
import { DOCUMENT_CHANTIER_TYPE_KEYS } from './document-chantier-type.keys';
import { APPROVAL_ENTITY_TYPE_KEYS } from './approval-entity-type.keys';
import { AVOIR_STATUS_KEYS } from './avoir-status.keys';
import { SITUATION_STATUS_KEYS } from './situation-status.keys';

/**
 * Registry of every key map exported by this barrel — keyed by the const name.
 *
 * Used by `i18n-labels.spec.ts` to assert that:
 *   - every value is a valid `enum.<entity>.<field>.<value>` key
 *   - every key is present in `core/fr.json` AND `core/en.json`
 *   - EN ≠ FR (except whitelisted acronyms)
 */
export const I18N_LABEL_REGISTRY: Record<string, Readonly<Record<string, string>>> = {
  FACTURE_STATUS_KEYS,
  FACTURE_TYPE_KEYS,
  MARCHE_STATUS_KEYS,
  MARCHE_TYPE_KEYS,
  MARCHE_NATURE_KEYS,
  AVENANT_TYPE_KEYS,
  AVENANT_STATUS_KEYS,
  CAUTION_TYPE_KEYS,
  CAUTION_STATUS_KEYS,
  DGD_STATUS_KEYS,
  ORDRE_SERVICE_TYPE_KEYS,
  ORDRE_SERVICE_STATUS_KEYS,
  FACTURE_MARCHE_STATUS_KEYS,
  AO_STATUS_KEYS,
  BCC_STATUS_KEYS,
  OFFRE_STATUS_KEYS,
  DA_STATUS_KEYS,
  CT_STATUS_KEYS,
  BC_STATUS_KEYS,
  NUMBERING_DOC_TYPE_KEYS,
  FAILURE_REASON_KEYS,
  OUTCOME_KEYS,
  MODE_KEYS,
  GRAVITE_KEYS,
  APTITUDE_KEYS,
  TYPE_VISITE_KEYS,
  PERIMETRE_KEYS,
  ETABLISSEMENT_TYPE_KEYS,
  PHASE_STATUS_KEYS,
  FORME_JURIDIQUE_KEYS,
  SOURCE_KEYS,
  DAY_KEYS,
  AMOUNT_SOURCE_KEYS,
  CHANTIER_STATUS_KEYS,
  CHANTIER_TYPE_KEYS,
  ATTACHEMENT_STATUS_KEYS,
  SOUS_TRAITANCE_STATUS_KEYS,
  FF_STATUS_KEYS,
  ECRITURE_STATUS_KEYS,
  ECRITURE_ORIGINE_KEYS,
  DUER_STATUS_KEYS,
  PPSPS_STATUS_KEYS,
  INCIDENT_STATUS_KEYS,
  INCIDENT_TYPE_KEYS,
  INSPECTION_STATUS_KEYS,
  FORMATION_STATUS_KEYS,
  NC_STATUS_KEYS,
  NC_TYPE_KEYS,
  EPI_STATUS_KEYS,
  EPI_CATEGORIE_KEYS,
  JOURNAL_EVENT_TYPE_KEYS,
  CONDITION_PAIEMENT_TYPE_KEYS,
  JOURNAL_TYPE_KEYS,
  MOUVEMENT_TRESORERIE_TYPE_KEYS,
  DEVIS_STATUS_KEYS,
  METRE_STATUS_KEYS,
  AO_CLIENT_STATUS_KEYS,
  AO_CLIENT_TYPE_KEYS,
  MOA_TYPE_KEYS,
  DOCUMENT_CHANTIER_TYPE_KEYS,
  APPROVAL_ENTITY_TYPE_KEYS,
  AVOIR_STATUS_KEYS,
  SITUATION_STATUS_KEYS,
};

/**
 * Convenience helper to resolve an enum value to its translation key.
 * Returns the input value when no key is registered (graceful degradation).
 *
 * ```ts
 * const key = resolveEnumKey(FACTURE_STATUS_KEYS, status);
 * translate.instant(key);
 * ```
 */
export function resolveEnumKey<K extends string>(
  map: Readonly<Record<K, string>>,
  value: K | string | null | undefined,
): string {
  if (value == null) return '';
  return (map as Record<string, string>)[value as string] ?? String(value);
}
