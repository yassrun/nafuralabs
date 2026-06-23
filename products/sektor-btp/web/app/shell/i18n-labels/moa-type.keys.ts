/**
 * i18n keys for MOA type. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR maps at:
 *   - web/app/applications/erp/pages/administration/moa/models/index.ts → MOA_TYPE_LABELS
 *   - web/app/applications/erp/pages/administration/parametres-fiscal/parametres-fiscal.page.ts → MOA_TYPE_LABELS
 */

type MoaType = 'ETAT' | 'EP' | 'COLLECTIVITE' | 'PRIVE';

export const MOA_TYPE_KEYS: Record<MoaType, string> = {
  ETAT:         'enum.moa_type.etat',
  EP:           'enum.moa_type.ep',
  COLLECTIVITE: 'enum.moa_type.collectivite',
  PRIVE:        'enum.moa_type.prive',
};
