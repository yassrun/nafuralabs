/**
 * i18n keys for Société forme juridique. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   web/app/applications/erp/pages/administration/societe/models/index.ts → FORME_JURIDIQUE_LABELS
 *
 * Note: SARL / SA / SAS / EURL are kept-as-is in EN (international acronyms),
 * but SARLAU and AUTOENTREPRENEUR are translated.
 */

import type { SocieteFormeJuridique } from '../../pages/administration/societe/models';

export const FORME_JURIDIQUE_KEYS: Record<SocieteFormeJuridique, string> = {
  SARL:   'enum.forme_juridique.sarl',
  SARLAU: 'enum.forme_juridique.sarlau',
  SA:     'enum.forme_juridique.sa',
  SAS:    'enum.forme_juridique.sas',
};
