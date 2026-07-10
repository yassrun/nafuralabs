import { buildDetailConfig } from '@lib/anatomy';
import type { DetailPageConfig } from '@lib/anatomy/types';

import type { Role } from '../../models';
import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

export const ROLE_DETAIL_CONFIG: DetailPageConfig<Role> = buildDetailConfig<Role>(
  {
    entityName: 'Role',
    permissionPrefix: 'administration.role',
    fields: FIELDS,
    routes: ROUTES,
  },
  {
    sections: SECTIONS,
    modes: {
      create: true,
      edit: true,
      view: true,
    },
    actions: {
      overrideActions: {
        delete: {
          disabled: (ctx) => Boolean(ctx.item?.isSystem),
        },
        duplicate: {
          disabled: (ctx) => Boolean(ctx.item?.isSystem),
        },
      },
    },
    saveSuccessMessage: 'Role saved successfully',
    saveErrorMessage: 'Failed to save role',
    deleteConfirm: {
      title: 'Delete Role',
      message: (item) =>
        `Delete role "${item.name}"? This action cannot be undone.`,
    },
    features: { audit: true },
    entityTypeForAudit: 'role',
  }
);
