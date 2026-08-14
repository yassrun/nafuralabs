/**
 * i18n keys for Exoneration Périmètre. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/administration/parametres-fiscal/parametres-fiscal.page.ts → PERIMETRE_LABELS
 */

export type ExonerationPerimetre =
  | 'LIVRAISON'
  | 'PRESTATION'
  | 'IMPORTATION'
  | 'EXPORTATION'
  | 'TOUS';

export const PERIMETRE_KEYS: Record<ExonerationPerimetre, string> = {
  LIVRAISON:   'enum.perimetre.livraison',
  PRESTATION:  'enum.perimetre.prestation',
  IMPORTATION: 'enum.perimetre.importation',
  EXPORTATION: 'enum.perimetre.exportation',
  TOUS:        'enum.perimetre.tous',
};
