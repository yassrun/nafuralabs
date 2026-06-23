/**
 * i18n keys for Facture Fournisseur status. Centralised in Phase 1.2.
 *
 * Replaces hardcoded FR map at:
 *   - web/app/applications/erp/pages/finance/factures-fournisseurs/ff-listing/ff-listing.page.ts
 *   - web/app/applications/erp/pages/finance/factures-fournisseurs/ff-detail/ff-detail.page.ts
 */

import type { FactureFournStatus } from '../../finance/models';

export const FF_STATUS_KEYS: Record<FactureFournStatus, string> = {
  BROUILLON:           'enum.ff.status.brouillon',
  VALIDEE:             'enum.ff.status.validee',
  COMPTABILISEE:       'enum.ff.status.comptabilisee',
  PARTIELLEMENT_PAYEE: 'enum.ff.status.partiellement_payee',
  PAYEE:               'enum.ff.status.payee',
  EN_LITIGE:           'enum.ff.status.en_litige',
  AVOIRISEE:           'enum.ff.status.avoirisee',
  ANNULEE:             'enum.ff.status.annulee',
};
