import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@platform/lib/anatomy';

import type { ConsultationAchat } from '../../services';
import { buildConsultationFields } from './fields';
import { ROUTES } from './routes';
import { buildConsultationSections } from './sections';

export function buildConsultationDetailConfig(t: TranslateService) {
  const tr = (k: string) => t.instant(k);
  return buildDetailConfig<ConsultationAchat>(
    {
      entityName: tr('achats.consultation.entityName'),
      icon: 'clipboard-list',
      permissionPrefix: 'achats.consultation',
      fields: buildConsultationFields(t),
      routes: ROUTES,
    },
    {
      sections: buildConsultationSections(t),
      viewModeAppearance: 'readonly',
      modes: {
        create: false,
        edit: false,
        view: true,
      },
      actions: {
        hideActions: ['delete', 'duplicate', 'save'],
      },
    },
  );
}
