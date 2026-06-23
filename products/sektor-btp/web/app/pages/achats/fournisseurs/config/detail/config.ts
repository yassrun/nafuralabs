import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@lib/anatomy';
import type { Fournisseur } from '@applications/erp/achats/models';

import { buildFournisseurFields } from './fields';
import { ROUTES } from './routes';
import { buildFournisseurSections } from './sections';

export function buildFournisseurDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<Fournisseur>(
    {
      entityName: tr('achats.fournisseur.entityName'),
      icon: 'truck',
      permissionPrefix: 'achats.fournisseur',
      fields: buildFournisseurFields(t),
      routes: ROUTES,
    },
    {
      sections: buildFournisseurSections(t),
      saveSuccessMessage: (item) =>
        tr('achats.fournisseur.toasts.saved').replace('{name}', (item as Fournisseur).raisonSociale),
      deleteConfirm: {
        title: tr('achats.fournisseur.deleteConfirm.title'),
        message: (item) =>
          tr('achats.fournisseur.deleteConfirm.message').replace('{name}', (item as Fournisseur).raisonSociale),
      },
    },
  );
}
