/**
 * i18n keys for HSE Incident gravité. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/hse/incidents/config/listing/columns.ts → GRAVITE_LABELS
 */

export type IncidentGravite = 'SANS_ARRET' | 'AVEC_ARRET' | 'GRAVE' | 'MORTEL';

export const GRAVITE_KEYS: Record<IncidentGravite, string> = {
  SANS_ARRET: 'enum.gravite.sans_arret',
  AVEC_ARRET: 'enum.gravite.avec_arret',
  GRAVE:      'enum.gravite.grave',
  MORTEL:     'enum.gravite.mortel',
};
