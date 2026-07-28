/**
 * Sektor BTP — i18n layer registry (hand-maintained).
 * Translation packs live under web/public/assets/i18n/**.
 */

import type { TranslationLayersConfig } from '@platform/core/i18n/i18n.module-loader';
import { ACTIVE_APPLICATION_ID } from './routes';

export const APPLICATION_TRANSLATION_LAYERS: Record<string, TranslationLayersConfig> = {
  erp: {
    core: [{ moduleId: 'core', path: 'core' }],

    features: [
      { moduleId: 'feature.collaboration', path: 'features/collaboration', optional: true },
      { moduleId: 'feature.finance-ap', path: 'features/finance-ap', optional: true },
      { moduleId: 'feature.financial', path: 'features/financial', optional: true },
      { moduleId: 'feature.geo', path: 'features/geo', optional: true },
      { moduleId: 'feature.inventory', path: 'features/inventory', optional: true },
      { moduleId: 'feature.item', path: 'features/item', optional: true },
      { moduleId: 'feature.location', path: 'features/location', optional: true },
      { moduleId: 'feature.measurement', path: 'features/measurement', optional: true },
      { moduleId: 'feature.partner', path: 'features/partner', optional: true },
      { moduleId: 'feature.sysconfig', path: 'features/sysconfig', optional: true },
    ],

    domains: [
      { moduleId: 'core.accounting', path: 'domains/core/accounting', optional: true },
      { moduleId: 'core.banking', path: 'domains/core/banking', optional: true },
      { moduleId: 'core.core-hr', path: 'domains/core/core-hr', optional: true },
      { moduleId: 'core.crm', path: 'domains/core/crm', optional: true },
      { moduleId: 'core.directory', path: 'domains/core/directory', optional: true },
      { moduleId: 'core.finance', path: 'domains/core/finance', optional: true },
      { moduleId: 'core.geography', path: 'domains/core/geography', optional: true },
      { moduleId: 'core.hr', path: 'domains/core/hr', optional: true },
      { moduleId: 'core.inventory', path: 'domains/core/inventory', optional: true },
      { moduleId: 'core.invoicing', path: 'domains/core/invoicing', optional: true },
      { moduleId: 'core.item', path: 'domains/core/item', optional: true },
      { moduleId: 'core.leave', path: 'domains/core/leave', optional: true },
      { moduleId: 'core.logistics', path: 'domains/core/logistics', optional: true },
      { moduleId: 'core.partner', path: 'domains/core/partner', optional: true },
      { moduleId: 'core.payroll', path: 'domains/core/payroll', optional: true },
      { moduleId: 'core.procurement', path: 'domains/core/procurement', optional: true },
      { moduleId: 'core.purchasing', path: 'domains/core/purchasing', optional: true },
      { moduleId: 'core.sales', path: 'domains/core/sales', optional: true },
      { moduleId: 'core.sales-orders', path: 'domains/core/sales-orders', optional: true },
      { moduleId: 'core.stock', path: 'domains/core/stock', optional: true },
      { moduleId: 'core.tax', path: 'domains/core/tax', optional: true },
      { moduleId: 'erp.item', path: 'domains/erp/item', optional: true },
      { moduleId: 'erp.stock', path: 'domains/erp/stock', optional: true },
      { moduleId: 'erp.currency', path: 'domains/erp/currency', optional: true },
    ],

    applications: [
      { moduleId: 'app', path: 'applications/app', optional: true },
      { moduleId: 'core', path: 'applications/core', optional: true },
      { moduleId: 'socle', path: 'applications/socle', optional: true },
      { moduleId: 'erp', path: 'applications/erp', optional: true },
      { moduleId: 'erp.admin', path: 'applications/erp/admin', optional: true },
      { moduleId: 'erp.dashboard', path: 'applications/erp/dashboard', optional: true },
      { moduleId: 'erp.ventes', path: 'applications/erp/ventes', optional: true },
      { moduleId: 'erp.finance', path: 'applications/erp/finance', optional: true },
      { moduleId: 'erp.marches', path: 'applications/erp/marches', optional: true },
      { moduleId: 'erp.achats', path: 'applications/erp/achats', optional: true },
      { moduleId: 'erp.inventory', path: 'applications/erp/inventory', optional: true },
      { moduleId: 'erp.chantiers', path: 'applications/erp/chantiers', optional: true },
      { moduleId: 'erp.rh', path: 'applications/erp/rh', optional: true },
      { moduleId: 'erp.hse', path: 'applications/erp/hse', optional: true },
      { moduleId: 'erp.shared', path: 'applications/erp/shared', optional: true },
      { moduleId: 'erp.onboarding', path: 'applications/erp/onboarding', optional: true },
      { moduleId: 'erp.invitations', path: 'applications/erp/invitations', optional: true },
    ],

    extras: [
      { moduleId: 'extras.doc-extractor', path: 'doc-extractor', optional: true },
      { moduleId: 'extras.financial', path: 'financial', optional: true },
      { moduleId: 'extras.fiscal', path: 'fiscal', optional: true },
      { moduleId: 'extras.geo', path: 'geo', optional: true },
      { moduleId: 'extras.inventory', path: 'stock', optional: true },
      { moduleId: 'extras.item', path: 'item', optional: true },
      { moduleId: 'extras.measurement', path: 'measurement', optional: true },
      { moduleId: 'extras.partner', path: 'partner', optional: true },
      { moduleId: 'extras.sysconfig', path: 'sysconfig', optional: true },
      { moduleId: 'extras.uom', path: 'uom', optional: true },
    ],
  },
};

export const ACTIVE_TRANSLATION_LAYERS: TranslationLayersConfig =
  APPLICATION_TRANSLATION_LAYERS[ACTIVE_APPLICATION_ID] || {
    core: [{ moduleId: 'core', path: 'core' }],
  };
