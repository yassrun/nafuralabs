/**
 * i18n keys for Journal de chantier event types. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/chantiers/journal/journal-chantier.page.ts → TYPE_LABELS
 */

export type JournalEventType =
  | 'VISITE_MOA'
  | 'INTEMPERIE'
  | 'LIVRAISON'
  | 'INCIDENT'
  | 'ORDRE_SERVICE'
  | 'REUNION'
  | 'CONSTAT'
  | 'AUTRE';

export const JOURNAL_EVENT_TYPE_KEYS: Record<JournalEventType, string> = {
  VISITE_MOA:    'enum.journal_event.type.visite_moa',
  INTEMPERIE:    'enum.journal_event.type.intemperie',
  LIVRAISON:     'enum.journal_event.type.livraison',
  INCIDENT:      'enum.journal_event.type.incident',
  ORDRE_SERVICE: 'enum.journal_event.type.ordre_service',
  REUNION:       'enum.journal_event.type.reunion',
  CONSTAT:       'enum.journal_event.type.constat',
  AUTRE:         'enum.journal_event.type.autre',
};
